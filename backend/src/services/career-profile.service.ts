import { prisma } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import {
  cacheCareerProfile,
  getCachedCareerProfile,
} from "../cache/career-cache";
import {
  acquireCareerLock,
  releaseCareerLock,
  waitForCareerProfile,
} from "../locks/career-lock";
import { getAIProvider } from "../ai/provider.factory";
import { careerProfileSchema } from "../ai/career-profile.schema";
import type { CareerProfile } from "../types/career";

interface CareerForProfileResolution {
  id: string;
  slug: string;
  name: string;
  description: string;
  profile: unknown;
}

function parseCareerProfileOrNull(
  profile: unknown,
): CareerProfile | null {
  const result = careerProfileSchema.safeParse(profile);

  if (!result.success) {
    return null;
  }

  return result.data;
}

export async function resolveCareerProfile(
  career: CareerForProfileResolution,
): Promise<CareerProfile> {
  // 1. Redis first.
  const cachedProfile = await getCachedCareerProfile(career.slug);

  if (cachedProfile) {
    return cachedProfile;
  }

  // 2. PostgreSQL profile.
  const existingProfile = parseCareerProfileOrNull(career.profile);

  if (existingProfile) {
    await cacheCareerProfile(
      career.slug,
      existingProfile,
      env.CAREER_CACHE_TTL_SECONDS,
    );

    return existingProfile;
  }

  // 3. Profile is missing/corrupt.
  // Acquire per-career generation lock.
  const lock = await acquireCareerLock(career.slug);

  if (!lock) {
    // Another request is generating it.
    const generatedProfile = await waitForCareerProfile(career.slug);

    if (generatedProfile) {
      return generatedProfile;
    }

    throw new AppError(
      "Career profile generation is still in progress. Please try again.",
      503,
      "CAREER_PROFILE_GENERATION_TIMEOUT",
    );
  }

  try {
    // 4. Double-check Redis after acquiring lock.
    const cachedAfterLock = await getCachedCareerProfile(
      career.slug,
    );

    if (cachedAfterLock) {
      return cachedAfterLock;
    }

    // 5. Another request may have repaired the DB
    // before we acquired the lock.
    const latestCareer = await prisma.career.findUnique({
      where: {
        id: career.id,
      },
      select: {
        profile: true,
      },
    });

    if (!latestCareer) {
      throw new AppError(
        "Career not found.",
        404,
        "CAREER_NOT_FOUND",
      );
    }

    const latestProfile = parseCareerProfileOrNull(
      latestCareer.profile,
    );

    if (latestProfile) {
      await cacheCareerProfile(
        career.slug,
        latestProfile,
        env.CAREER_CACHE_TTL_SECONDS,
      );

      return latestProfile;
    }

    // 6. Generate profile with LLM.
    const provider = getAIProvider();

    const generated = await provider.generateCareerProfile({
      careerName: career.name,
      careerDescription: career.description,
    });

    // 7. Validate LLM output.
    const validated = careerProfileSchema.safeParse(generated);

    if (!validated.success) {
      throw new AppError(
        "AI generated an invalid career profile.",
        502,
        "AI_INVALID_PROFILE",
      );
    }

    const profile = validated.data;

    // 8. PostgreSQL is source of truth.
    await prisma.career.update({
      where: {
        id: career.id,
      },
      data: {
        profile,
      },
    });

    // 9. Populate Redis.
    await cacheCareerProfile(
      career.slug,
      profile,
      env.CAREER_CACHE_TTL_SECONDS,
    );

    return profile;
  } finally {
    // 10. Always release our own lock safely.
    await releaseCareerLock(lock);
  }
}

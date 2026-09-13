import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type { CareerResponse } from "../types/career";
import { env } from "../config/env";
import {
  cacheCareerProfile,
  getCachedCareerProfile,
} from "../cache/career-cache";
import type { CareerProfile } from "../types/career";
const careerSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
} as const;

export async function getCareers(): Promise<CareerResponse[]> {
  return prisma.career.findMany({
    select: careerSelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCareerById(
  careerId: string,
): Promise<CareerResponse> {
  const career = await prisma.career.findUnique({
    where: {
      id: careerId,
    },
    select: careerSelect,
  });

  if (!career) {
    throw new AppError(
      "Career not found.",
      404,
      "CAREER_NOT_FOUND",
    );
  }

  return career;
}

function parseCareerProfile(profile: unknown): CareerProfile {
  if (
    typeof profile !== "object" ||
    profile === null ||
    !("skills" in profile) ||
    !Array.isArray(profile.skills)
  ) {
    throw new AppError(
      "Career profile is invalid.",
      500,
      "INVALID_CAREER_PROFILE",
    );
  }

  return profile as CareerProfile;
}

export async function getCareerProfile(
  careerId: string,
): Promise<CareerProfile> {
  const career = await prisma.career.findUnique({
    where: {
      id: careerId,
    },
    select: {
      id: true,
      slug: true,
      profile: true,
    },
  });

  if (!career) {
    throw new AppError("Career not found.", 404, "CAREER_NOT_FOUND");
  }

  const cachedProfile = await getCachedCareerProfile(career.slug);

  if (cachedProfile) {
    return cachedProfile;
  }

  const profile = parseCareerProfile(career.profile);

  await cacheCareerProfile(career.slug, profile, env.CAREER_CACHE_TTL_SECONDS);

  return profile;
}

export async function getCareerProfileBySlug(
  slug: string,
): Promise<CareerProfile> {
  const cachedProfile = await getCachedCareerProfile(slug);

  if (cachedProfile) {
    return cachedProfile;
  }

  const career = await prisma.career.findUnique({
    where: {
      slug,
    },
    select: {
      profile: true,
    },
  });

  if (!career) {
    throw new AppError("Career not found.", 404, "CAREER_NOT_FOUND");
  }

  const profile = parseCareerProfile(career.profile);

  await cacheCareerProfile(slug, profile, env.CAREER_CACHE_TTL_SECONDS);

  return profile;
}

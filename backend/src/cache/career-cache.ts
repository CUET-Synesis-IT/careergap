import { redis } from "../config/redis";
import type { CareerProfile } from "../types/career";

const CAREER_CACHE_PREFIX = "career:profile:";

export function getCareerProfileCacheKey(
  slug: string,
): string {
  return `${CAREER_CACHE_PREFIX}${slug}`;
}

export async function getCachedCareerProfile(
  slug: string,
): Promise<CareerProfile | null> {
  const key = getCareerProfileCacheKey(slug);

  const cached = await redis.get(key);

  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as CareerProfile;
  } catch (error) {
    console.error(
      `Invalid cached career profile for ${slug}:`,
      error,
    );

    // Remove corrupt cache so the next request can
    // recover from PostgreSQL.
    await redis.del(key);

    return null;
  }
}

export async function cacheCareerProfile(
  slug: string,
  profile: CareerProfile,
  ttlSeconds: number,
): Promise<void> {
  const key = getCareerProfileCacheKey(slug);

  await redis.set(
    key,
    JSON.stringify(profile),
    {
      EX: ttlSeconds,
    },
  );
}

export async function deleteCachedCareerProfile(
  slug: string,
): Promise<void> {
  const key = getCareerProfileCacheKey(slug);

  await redis.del(key);
}

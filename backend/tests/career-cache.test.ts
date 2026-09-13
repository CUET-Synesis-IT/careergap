import crypto from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../src/config/database";
import { connectRedis, disconnectRedis, redis } from "../src/config/redis";
import {
  cacheCareerProfile,
  deleteCachedCareerProfile,
  getCachedCareerProfile,
  getCareerProfileCacheKey,
} from "../src/cache/career-cache";
import { getCareerProfileBySlug } from "../src/services/career.service";

describe("Career Profile Cache", () => {
  const slug = `cache-test-${crypto.randomUUID()}`;

  const profile = {
    skills: [
      {
        name: "Node.js",
        importance: "HIGH" as const,
      },
      {
        name: "Docker",
        importance: "MEDIUM" as const,
      },
    ],
  };

  beforeAll(async () => {
    if (!redis.isOpen) {
      await connectRedis();
    }

    await redis.del(getCareerProfileCacheKey(slug));
  });

  afterAll(async () => {
    if (redis.isOpen) {
      await redis.del(getCareerProfileCacheKey(slug));

      await disconnectRedis();
    }
  });

  it("stores and retrieves a career profile from Redis", async () => {
    await cacheCareerProfile(slug, profile, 60);

    const cached = await getCachedCareerProfile(slug);

    expect(cached).toEqual(profile);
  });

  it("uses the expected Redis key", () => {
    expect(getCareerProfileCacheKey("backend_engineer")).toBe(
      "career:profile:backend_engineer",
    );
  });

  it("returns null when the career profile is not cached", async () => {
    await deleteCachedCareerProfile(slug);

    const cached = await getCachedCareerProfile(slug);

    expect(cached).toBeNull();
  });

  it("loads profile from PostgreSQL on cache miss and caches it", async () => {
    const career = await prisma.career.findUnique({
      where: {
        slug: "backend_engineer",
      },
      select: {
        profile: true,
      },
    });

    expect(career).not.toBeNull();

    await deleteCachedCareerProfile("backend_engineer");

    const result = await getCareerProfileBySlug("backend_engineer");

    expect(result).toEqual(career!.profile);

    const cached = await getCachedCareerProfile("backend_engineer");

    expect(cached).toEqual(result);
  });
});

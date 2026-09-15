vi.mock("../src/ai/provider.factory", () => ({
  getAIProvider: vi.fn(),
}));

import crypto from "node:crypto";
import {
  afterAll,
  beforeAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { prisma } from "../src/config/database";
import { connectRedis, disconnectRedis, redis } from "../src/config/redis";
import {
  getCachedCareerProfile,
  getCareerProfileCacheKey,
} from "../src/cache/career-cache";
import { getAIProvider } from "../src/ai/provider.factory";
import { resolveCareerProfile } from "../src/services/career-profile.service";

describe("Career Profile LLM Fallback", () => {
  const createdCareerIds: string[] = [];
  const createdSlugs: string[] = [];

  beforeAll(async () => {
    if (!redis.isOpen) {
      await connectRedis();
    }
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    for (const slug of createdSlugs.splice(0)) {
      await redis.del(getCareerProfileCacheKey(slug));
    }

    if (createdCareerIds.length > 0) {
      await prisma.career.deleteMany({
        where: {
          id: {
            in: createdCareerIds.splice(0),
          },
        },
      });
    }
  });

  afterAll(async () => {
    if (redis.isOpen) {
      await disconnectRedis();
    }
  });

  async function createBrokenCareer() {
    const slug = `fallback-test-${crypto.randomUUID()}`;

    const career = await prisma.career.create({
      data: {
        slug,
        name: "Fallback Test Engineer",
        description:
          "A test career used to verify career profile generation fallback.",
        profile: {},
      },
    });

    createdCareerIds.push(career.id);
    createdSlugs.push(slug);

    return career;
  }

  it("generates a profile when the PostgreSQL profile is invalid", async () => {
    const career = await createBrokenCareer();

    const generatedProfile = {
      skills: [
        {
          name: "Node.js",
          importance: "HIGH" as const,
        },
        {
          name: "PostgreSQL",
          importance: "HIGH" as const,
        },
        {
          name: "Docker",
          importance: "MEDIUM" as const,
        },
      ],
    };

    const generateCareerProfile = vi.fn().mockResolvedValue(generatedProfile);

    vi.mocked(getAIProvider).mockReturnValue({
      generateCareerProfile,
    });

    const result = await resolveCareerProfile(career);

    expect(result).toEqual(generatedProfile);
    expect(generateCareerProfile).toHaveBeenCalledTimes(1);

    const updatedCareer = await prisma.career.findUnique({
      where: {
        id: career.id,
      },
      select: {
        profile: true,
      },
    });

    expect(updatedCareer?.profile).toEqual(generatedProfile);

    const cached = await getCachedCareerProfile(career.slug);

    expect(cached).toEqual(generatedProfile);
  });

  it("uses Redis after profile generation", async () => {
    const career = await createBrokenCareer();

    const generatedProfile = {
      skills: [
        {
          name: "TypeScript",
          importance: "HIGH" as const,
        },
      ],
    };

    const generateCareerProfile = vi.fn().mockResolvedValue(generatedProfile);

    vi.mocked(getAIProvider).mockReturnValue({
      generateCareerProfile,
    });

    const firstResult = await resolveCareerProfile(career);
    const secondResult = await resolveCareerProfile(career);

    expect(firstResult).toEqual(generatedProfile);
    expect(secondResult).toEqual(generatedProfile);

    // Only first request should call AI.
    expect(generateCareerProfile).toHaveBeenCalledTimes(1);
  });

  it("allows only one concurrent request to generate a missing profile", async () => {
    const career = await createBrokenCareer();

    const generatedProfile = {
      skills: [
        {
          name: "Node.js",
          importance: "HIGH" as const,
        },
        {
          name: "Redis",
          importance: "MEDIUM" as const,
        },
      ],
    };

    const generateCareerProfile = vi.fn().mockImplementation(async () => {
      // Simulate slow LLM response.
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      return generatedProfile;
    });

    vi.mocked(getAIProvider).mockReturnValue({
      generateCareerProfile,
    });

    const requests = Array.from({ length: 10 }, () =>
      resolveCareerProfile(career),
    );

    const results = await Promise.all(requests);

    expect(results).toHaveLength(10);

    for (const result of results) {
      expect(result).toEqual(generatedProfile);
    }

    // Critical concurrency guarantee:
    // 10 requests -> 1 LLM call.
    expect(generateCareerProfile).toHaveBeenCalledTimes(1);

    const savedCareer = await prisma.career.findUnique({
      where: {
        id: career.id,
      },
      select: {
        profile: true,
      },
    });

    expect(savedCareer?.profile).toEqual(generatedProfile);
  });

  it("does not call AI when a valid PostgreSQL profile exists", async () => {
    const career = await prisma.career.create({
      data: {
        slug: `valid-profile-test-${crypto.randomUUID()}`,
        name: "Valid Profile Test Engineer",
        description: "Test career with a valid profile.",
        profile: {
          skills: [
            {
              name: "Node.js",
              importance: "HIGH",
            },
          ],
        },
      },
    });

    createdCareerIds.push(career.id);
    createdSlugs.push(career.slug);

    const generateCareerProfile = vi.fn();

    vi.mocked(getAIProvider).mockReturnValue({
      generateCareerProfile,
    });

    const result = await resolveCareerProfile(career);

    expect(result).toEqual({
      skills: [
        {
          name: "Node.js",
          importance: "HIGH",
        },
      ],
    });

    expect(generateCareerProfile).not.toHaveBeenCalled();

    const cached = await getCachedCareerProfile(career.slug);

    expect(cached).toEqual(result);
  });
});

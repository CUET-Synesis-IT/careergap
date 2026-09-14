import crypto from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../src/ai/provider.factory", () => ({
  getAIProvider: vi.fn(),
}));

import { prisma } from "../src/config/database";
import {
  connectRedis,
  disconnectRedis,
  redis,
} from "../src/config/redis";
import {
  deleteCachedCareerProfile,
  getCareerProfileCacheKey,
} from "../src/cache/career-cache";
import { getAIProvider } from "../src/ai/provider.factory";
import {
  createAnalysis,
  getAnalysisById,
  getUserAnalyses,
} from "../src/services/analysis.service";

describe("Analysis Service", () => {
  const createdAnalysisIds: string[] = [];
  const createdResumeIds: string[] = [];
  const createdCareerIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdCareerSlugs: string[] = [];

  beforeAll(async () => {
    if (!redis.isOpen) {
      await connectRedis();
    }
  });

  afterEach(async () => {
    vi.clearAllMocks();

    if (createdAnalysisIds.length > 0) {
      await prisma.review.deleteMany({
        where: {
          reviewTask: {
            analysisId: {
              in: createdAnalysisIds,
            },
          },
        },
      });

      await prisma.reviewTask.deleteMany({
        where: {
          analysisId: {
            in: createdAnalysisIds,
          },
        },
      });

      await prisma.analysis.deleteMany({
        where: {
          id: {
            in: createdAnalysisIds,
          },
        },
      });

      createdAnalysisIds.length = 0;
    }

    if (createdResumeIds.length > 0) {
      await prisma.resume.deleteMany({
        where: {
          id: {
            in: createdResumeIds,
          },
        },
      });

      createdResumeIds.length = 0;
    }

    if (createdCareerSlugs.length > 0) {
      for (const slug of createdCareerSlugs) {
        await redis.del(getCareerProfileCacheKey(slug));
      }

      createdCareerSlugs.length = 0;
    }

    if (createdCareerIds.length > 0) {
      await prisma.career.deleteMany({
        where: {
          id: {
            in: createdCareerIds,
          },
        },
      });

      createdCareerIds.length = 0;
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds,
          },
        },
      });

      createdUserIds.length = 0;
    }
  });

  afterAll(async () => {
    if (redis.isOpen) {
      await disconnectRedis();
    }
  });

  async function createTestData() {
    const user = await prisma.user.create({
      data: {
        name: "Analysis Test User",
        email: `analysis-${crypto.randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
      },
    });

    createdUserIds.push(user.id);

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: "analysis-test.pdf",
        text: `
          Yeaish Jahan Turj
          Backend Engineer
          Node.js
          PostgreSQL
          Docker
        `.trim(),
        textHash: crypto
          .createHash("sha256")
          .update(user.id)
          .digest("hex"),
      },
    });

    createdResumeIds.push(resume.id);

    const slug = `analysis-career-${crypto.randomUUID()}`;

    const career = await prisma.career.create({
      data: {
        slug,
        name: "Analysis Test Backend Engineer",
        description:
          "Backend engineering career for analysis integration tests.",
        profile: {
          skills: [
            {
              name: "Node.js",
              importance: "HIGH",
            },
            {
              name: "PostgreSQL",
              importance: "HIGH",
            },
            {
              name: "Docker",
              importance: "MEDIUM",
            },
            {
              name: "Redis",
              importance: "MEDIUM",
            },
          ],
        },
      },
    });

    createdCareerIds.push(career.id);
    createdCareerSlugs.push(slug);

    return {
      user,
      resume,
      career,
    };
  }

  function mockSkillExtraction(skills: string[]) {
    vi.mocked(getAIProvider).mockReturnValue({
      extractResumeSkills: vi
        .fn()
        .mockResolvedValue({ skills }),

      generateCareerProfile: vi.fn(),
    });
  }

  it("runs the complete analysis pipeline", async () => {
    const { user, resume, career } =
      await createTestData();

    mockSkillExtraction([
      "nodejs",
      "postgres",
      "docker",
    ]);

    const result = await createAnalysis(
      user.id,
      resume.id,
      career.id,
    );

    expect(result.status).toBe("REVIEW");
    expect(result.resumeId).toBe(resume.id);
    expect(result.careerId).toBe(career.id);

    expect(result.aiResult).toEqual({
      matchPercentage: 75,
      matchedSkills: [
        "Node.js",
        "PostgreSQL",
        "Docker",
      ],
      missingSkills: [
        "Redis",
      ],
    });

    const savedAnalysis =
      await prisma.analysis.findUnique({
        where: {
          id: result.id,
        },
      });

    expect(savedAnalysis).not.toBeNull();

    expect(savedAnalysis?.status).toBe("REVIEW");

    expect(savedAnalysis?.extractedSkills).toEqual({
      skills: [
        "Node.js",
        "PostgreSQL",
        "Docker",
      ],
    });

    expect(savedAnalysis?.aiMatchPercentage).toBe(75);

    expect(savedAnalysis?.aiMatchedSkills).toEqual({
      skills: [
        "Node.js",
        "PostgreSQL",
        "Docker",
      ],
    });

    expect(savedAnalysis?.aiMissingSkills).toEqual({
      skills: [
        "Redis",
      ],
    });

    expect(savedAnalysis?.finalMatchPercentage).toBeNull();
    expect(savedAnalysis?.finalMatchedSkills).toBeNull();
    expect(savedAnalysis?.finalMissingSkills).toBeNull();

    const reviewTask =
      await prisma.reviewTask.findUnique({
        where: {
          analysisId: result.id,
        },
      });

    expect(reviewTask).not.toBeNull();
    expect(reviewTask?.status).toBe("OPEN");
  });

  it("calls AI exactly once", async () => {
    const { user, resume, career } =
      await createTestData();

    const extractResumeSkills = vi
      .fn()
      .mockResolvedValue({
        skills: [
          "Node.js",
          "PostgreSQL",
        ],
      });

    vi.mocked(getAIProvider).mockReturnValue({
      extractResumeSkills,
      generateCareerProfile: vi.fn(),
    });

    await createAnalysis(
      user.id,
      resume.id,
      career.id,
    );

    expect(extractResumeSkills).toHaveBeenCalledTimes(1);
  });

  it("rejects analysis when resume belongs to another user", async () => {
    const { resume, career } = await createTestData();

    const otherUser = await prisma.user.create({
      data: {
        name: "Other User",
        email: `other-${crypto.randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
      },
    });

    createdUserIds.push(otherUser.id);

    mockSkillExtraction(["Node.js"]);

    await expect(
      createAnalysis(
        otherUser.id,
        resume.id,
        career.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "RESUME_NOT_FOUND",
    });
  });

  it("rejects unknown career", async () => {
    const { user, resume } = await createTestData();

    mockSkillExtraction(["Node.js"]);

    await expect(
      createAnalysis(
        user.id,
        resume.id,
        crypto.randomUUID(),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "CAREER_NOT_FOUND",
    });
  });

  it("rejects duplicate active analysis", async () => {
    const { user, resume, career } =
      await createTestData();

    mockSkillExtraction(["Node.js"]);

    await createAnalysis(
      user.id,
      resume.id,
      career.id,
    );

    await expect(
      createAnalysis(
        user.id,
        resume.id,
        career.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_ANALYSIS",
    });
  });

  it("marks analysis FAILED when AI extraction fails", async () => {
    const { user, resume, career } =
      await createTestData();

    const extractResumeSkills = vi
      .fn()
      .mockRejectedValue(
        new Error("AI provider unavailable"),
      );

    vi.mocked(getAIProvider).mockReturnValue({
      extractResumeSkills,
      generateCareerProfile: vi.fn(),
    });

    await expect(
      createAnalysis(
        user.id,
        resume.id,
        career.id,
      ),
    ).rejects.toThrow("AI provider unavailable");

    const failedAnalysis =
      await prisma.analysis.findFirst({
        where: {
          userId: user.id,
          resumeId: resume.id,
          careerId: career.id,
        },
      });

    expect(failedAnalysis).not.toBeNull();
    expect(failedAnalysis?.status).toBe("FAILED");
  });

  it("does not expose another user's analysis", async () => {
    const { user, resume, career } =
      await createTestData();

    mockSkillExtraction(["Node.js"]);

    const analysis = await createAnalysis(
      user.id,
      resume.id,
      career.id,
    );

    const otherUser = await prisma.user.create({
      data: {
        name: "Another User",
        email: `another-${crypto.randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
      },
    });

    createdUserIds.push(otherUser.id);

    await expect(
      getAnalysisById(
        otherUser.id,
        analysis.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "ANALYSIS_NOT_FOUND",
    });
  });

  it("returns only analyses owned by the user", async () => {
    const first = await createTestData();

    mockSkillExtraction(["Node.js"]);

    await createAnalysis(
      first.user.id,
      first.resume.id,
      first.career.id,
    );

    const second = await createTestData();

    mockSkillExtraction(["PostgreSQL"]);

    await createAnalysis(
      second.user.id,
      second.resume.id,
      second.career.id,
    );

    const analyses = await getUserAnalyses(
      first.user.id,
    );

    expect(analyses).toHaveLength(1);
    expect(analyses[0].resumeId).toBe(
      first.resume.id,
    );
  });

  it("uses cached career profile without generating a new profile", async () => {
    const { user, resume, career } =
      await createTestData();

    await deleteCachedCareerProfile(
      career.slug,
    );

    mockSkillExtraction(["Node.js"]);

    await createAnalysis(
      user.id,
      resume.id,
      career.id,
    );

    const provider = vi.mocked(
      getAIProvider,
    );

    expect(
      provider().generateCareerProfile,
    ).not.toHaveBeenCalled();
  });
});

import bcrypt from "bcrypt";
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

import request from "supertest";

vi.mock("../src/ai/provider.factory", () => ({
  getAIProvider: vi.fn(),
}));

import app from "../src/app";
import { prisma } from "../src/config/database";
import { connectRedis, disconnectRedis, redis } from "../src/config/redis";
import { getAIProvider } from "../src/ai/provider.factory";

describe("Analysis + Review REST API", () => {
  const createdAnalysisIds: string[] = [];
  const createdTaskIds: string[] = [];
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
    if (createdTaskIds.length > 0) {
      await prisma.review.deleteMany({
        where: {
          reviewTaskId: {
            in: createdTaskIds,
          },
        },
      });

      await prisma.reviewTask.deleteMany({
        where: {
          id: {
            in: createdTaskIds,
          },
        },
      });

      createdTaskIds.length = 0;
    }

    if (createdAnalysisIds.length > 0) {
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
        await redis.del(`career:profile:${slug}`);
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

    vi.clearAllMocks();
  });

  afterAll(async () => {
    if (redis.isOpen) {
      await disconnectRedis();
    }
  });

  function mockSkillExtraction(skills: string[]) {
    vi.mocked(getAIProvider).mockReturnValue({
      extractResumeSkills: vi.fn().mockResolvedValue({ skills }),

      generateCareerProfile: vi.fn(),
    });
  }

  async function createUser(
    role: "USER" | "REVIEWER" | "SUPER_ADMIN" = "USER",
  ) {
    const passwordHash = await bcrypt.hash(passwordForTests, 4);

    const user = await prisma.user.create({
      data: {
        name: `${role} Test User`,
        email: `${crypto.randomUUID()}@api.test`,
        passwordHash,
        role,
      },
    });

    createdUserIds.push(user.id);

    return user;
  }

  async function getAccessToken(email: string, password = "Password123!") {
    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);

    return response.body.data.accessToken as string;
  }

  async function createLoginUser(
    role: "USER" | "REVIEWER" | "SUPER_ADMIN" = "USER",
  ) {
    if (role === "USER") {
      const email = `${crypto.randomUUID()}@api.test`;

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          name: "API Test User",
          email,
          password: passwordForTests,
        });

      expect(registerResponse.status).toBe(201);

      const token = await getAccessToken(email);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
      });

      createdUserIds.push(user.id);

      return {
        user,
        token,
      };
    }

    const user = await createUser(role);

    const token = await getAccessToken(user.email);

    return {
      user,
      token,
    };
  }

  const passwordForTests = "Password123!";

  async function createAnalysisFixture(userId: string) {
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: "api-test.pdf",
        text: `
          Backend Engineer
          Node.js
          PostgreSQL
          Docker
        `.trim(),
        textHash: crypto
          .createHash("sha256")
          .update(crypto.randomUUID())
          .digest("hex"),
      },
    });

    createdResumeIds.push(resume.id);

    const slug = `api-career-${crypto.randomUUID()}`;

    const career = await prisma.career.create({
      data: {
        slug,
        name: "API Test Backend Engineer",
        description: "Career used for REST API integration tests.",
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
      resume,
      career,
    };
  }

  async function createReviewFixture() {
    const candidate = await createUser("USER");
    const reviewer = await createUser("REVIEWER");

    const { resume, career } = await createAnalysisFixture(candidate.id);

    const analysis = await prisma.analysis.create({
      data: {
        userId: candidate.id,
        resumeId: resume.id,
        careerId: career.id,
        extractedSkills: {
          skills: ["Node.js", "PostgreSQL"],
        },
        aiMatchPercentage: 66.67,
        aiMatchedSkills: {
          skills: ["Node.js", "PostgreSQL"],
        },
        aiMissingSkills: {
          skills: ["Docker", "Redis"],
        },
        status: "REVIEW",
      },
    });

    createdAnalysisIds.push(analysis.id);

    const task = await prisma.reviewTask.create({
      data: {
        analysisId: analysis.id,
        status: "OPEN",
      },
    });

    createdTaskIds.push(task.id);

    return {
      candidate,
      reviewer,
      resume,
      career,
      analysis,
      task,
    };
  }

  // ==========================================================
  // ANALYSIS API
  // ==========================================================

  describe("Analysis API", () => {
    it("rejects unauthenticated analysis creation", async () => {
      const response = await request(app).post("/api/analyses").send({
        resumeId: crypto.randomUUID(),
        careerId: crypto.randomUUID(),
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("rejects REVIEWER from creating an analysis", async () => {
      const { token } = await createLoginUser("REVIEWER");

      const response = await request(app)
        .post("/api/analyses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resumeId: crypto.randomUUID(),
          careerId: crypto.randomUUID(),
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("rejects invalid analysis request body", async () => {
      const { token } = await createLoginUser("USER");

      const response = await request(app)
        .post("/api/analyses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resumeId: "not-a-uuid",
          careerId: "not-a-uuid",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it("creates an analysis through the REST API", async () => {
      const { user, token } = await createLoginUser("USER");

      const { resume, career } = await createAnalysisFixture(user.id);

      mockSkillExtraction(["nodejs", "postgres", "docker"]);

      const response = await request(app)
        .post("/api/analyses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resumeId: resume.id,
          careerId: career.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        resumeId: resume.id,
        careerId: career.id,
        status: "REVIEW",
      });

      expect(response.body.data.aiResult).toEqual({
        matchPercentage: 75,
        matchedSkills: ["Node.js", "PostgreSQL", "Docker"],
        missingSkills: ["Redis"],
      });

      expect(getAIProvider).toHaveBeenCalledTimes(1);

      createdAnalysisIds.push(response.body.data.id);
    });

    it("returns the current user's analysis history", async () => {
      const { user, token } = await createLoginUser("USER");

      const { resume, career } = await createAnalysisFixture(user.id);

      mockSkillExtraction(["nodejs"]);

      const createResponse = await request(app)
        .post("/api/analyses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resumeId: resume.id,
          careerId: career.id,
        });

      expect(createResponse.status).toBe(201);

      const analysisId = createResponse.body.data.id as string;

      createdAnalysisIds.push(analysisId);

      const response = await request(app)
        .get("/api/analyses")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.some(
          (analysis: { id: string }) => analysis.id === analysisId,
        ),
      ).toBe(true);
    });

    it("returns the user's own analysis by ID", async () => {
      const { user, token } = await createLoginUser("USER");

      const { resume, career } = await createAnalysisFixture(user.id);

      mockSkillExtraction(["nodejs"]);

      const createResponse = await request(app)
        .post("/api/analyses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          resumeId: resume.id,
          careerId: career.id,
        });

      const analysisId = createResponse.body.data.id as string;

      createdAnalysisIds.push(analysisId);

      const response = await request(app)
        .get(`/api/analyses/${analysisId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(analysisId);
    });

    it("does not allow one user to access another user's analysis", async () => {
      const owner = await createLoginUser("USER");

      const otherUser = await createLoginUser("USER");

      const { resume, career } = await createAnalysisFixture(owner.user.id);

      mockSkillExtraction(["nodejs"]);

      const createResponse = await request(app)
        .post("/api/analyses")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          resumeId: resume.id,
          careerId: career.id,
        });

      const analysisId = createResponse.body.data.id as string;

      createdAnalysisIds.push(analysisId);

      const response = await request(app)
        .get(`/api/analyses/${analysisId}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("ANALYSIS_NOT_FOUND");
    });
  });

  // ==========================================================
  // REVIEW API
  // ==========================================================

  describe("Review API", () => {
    it("rejects unauthenticated access to review queue", async () => {
      const response = await request(app).get("/api/reviews/tasks");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("rejects USER from accessing review queue", async () => {
      const { token } = await createLoginUser("USER");

      const response = await request(app)
        .get("/api/reviews/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("allows REVIEWER to access open review tasks", async () => {
      const { reviewer, task } = await createReviewFixture();

      const token = await getAccessToken(reviewer.email);

      const response = await request(app)
        .get("/api/reviews/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.some((item: { id: string }) => item.id === task.id),
      ).toBe(true);
    });

    it("allows reviewer to claim a task", async () => {
      const { reviewer, task } = await createReviewFixture();

      const token = await getAccessToken(reviewer.email);

      const response = await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.status).toBe("LOCKED");
      expect(response.body.data.lockedById).toBe(reviewer.id);

      expect(response.body.data.lockExpiresAt).toBeTruthy();
    });

    it("prevents a second reviewer from claiming the same task", async () => {
      const { reviewer, task } = await createReviewFixture();

      const otherReviewer = await createUser("REVIEWER");

      const reviewerToken = await getAccessToken(reviewer.email);

      const otherToken = await getAccessToken(otherReviewer.email);

      const firstResponse = await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${reviewerToken}`);

      expect(firstResponse.status).toBe(200);

      const secondResponse = await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.success).toBe(false);
    });

    it("allows the reviewer who owns the lock to retrieve the task", async () => {
      const { reviewer, task } = await createReviewFixture();

      const token = await getAccessToken(reviewer.email);

      await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/reviews/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.status).toBe("LOCKED");
    });

    it("prevents another reviewer from retrieving a locked task", async () => {
      const { reviewer, task } = await createReviewFixture();

      const otherReviewer = await createUser("REVIEWER");

      const reviewerToken = await getAccessToken(reviewer.email);

      const otherToken = await getAccessToken(otherReviewer.email);

      await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/reviews/tasks/${task.id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("submits a review through the REST API and completes the analysis", async () => {
      const { candidate, reviewer, analysis, task } =
        await createReviewFixture();

      const reviewerToken = await getAccessToken(reviewer.email);

      const candidateToken = await getAccessToken(candidate.email);

      await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .expect(200);

      const submitResponse = await request(app)
        .post(`/api/reviews/tasks/${task.id}/submit`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .send({
          finalMatchPercentage: 100,
          finalMatchedSkills: ["Node.js", "PostgreSQL", "Docker"],
          finalMissingSkills: [],
          comment: "Verified by reviewer.",
        });

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body.success).toBe(true);

      const updatedTask = await prisma.reviewTask.findUnique({
        where: {
          id: task.id,
        },
        select: {
          status: true,
          lockedById: true,
          lockExpiresAt: true,
          completedAt: true,
        },
      });

      expect(updatedTask?.status).toBe("COMPLETED");

      expect(updatedTask?.lockedById).toBeNull();
      expect(updatedTask?.lockExpiresAt).toBeNull();
      expect(updatedTask?.completedAt).not.toBeNull();

      const updatedAnalysis = await prisma.analysis.findUnique({
        where: {
          id: analysis.id,
        },
        select: {
          status: true,
          finalMatchPercentage: true,
          finalMatchedSkills: true,
          finalMissingSkills: true,
        },
      });

      expect(updatedAnalysis?.status).toBe("COMPLETED");

      expect(updatedAnalysis?.finalMatchPercentage).toBe(100);

      expect(updatedAnalysis?.finalMatchedSkills).toEqual({
        skills: ["Node.js", "PostgreSQL", "Docker"],
      });

      expect(updatedAnalysis?.finalMissingSkills).toEqual({
        skills: [],
      });

      const userResponse = await request(app)
        .get(`/api/analyses/${analysis.id}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.success).toBe(true);

      expect(userResponse.body.data.status).toBe("COMPLETED");

      expect(userResponse.body.data.finalResult).toEqual({
        matchPercentage: 100,
        matchedSkills: ["Node.js", "PostgreSQL", "Docker"],
        missingSkills: [],
      });
    });

    it("rejects invalid review submission data", async () => {
      const { reviewer, task } = await createReviewFixture();

      const token = await getAccessToken(reviewer.email);

      await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const response = await request(app)
        .post(`/api/reviews/tasks/${task.id}/submit`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          finalMatchPercentage: 150,
          finalMatchedSkills: [],
          finalMissingSkills: [],
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it("rejects submission by another reviewer", async () => {
      const { reviewer, task } = await createReviewFixture();

      const otherReviewer = await createUser("REVIEWER");

      const reviewerToken = await getAccessToken(reviewer.email);

      const otherToken = await getAccessToken(otherReviewer.email);

      await request(app)
        .post(`/api/reviews/tasks/${task.id}/claim`)
        .set("Authorization", `Bearer ${reviewerToken}`)
        .expect(200);

      const response = await request(app)
        .post(`/api/reviews/tasks/${task.id}/submit`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          finalMatchPercentage: 50,
          finalMatchedSkills: ["Node.js"],
          finalMissingSkills: ["PostgreSQL", "Docker"],
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});

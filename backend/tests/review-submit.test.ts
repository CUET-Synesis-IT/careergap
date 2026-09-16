import crypto from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../src/config/database";
import { connectRedis, disconnectRedis, redis } from "../src/config/redis";
import { claimReviewTask, submitReview } from "../src/services/review.service";

describe("Review Submission", () => {
  const createdTaskIds: string[] = [];
  const createdAnalysisIds: string[] = [];
  const createdCareerIds: string[] = [];
  const createdResumeIds: string[] = [];
  const createdUserIds: string[] = [];

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

  async function createReviewTask() {
    const candidate = await prisma.user.create({
      data: {
        name: "Candidate",
        email: `${crypto.randomUUID()}@candidate.test`,
        passwordHash: "test-password-hash",
        role: "USER",
      },
    });

    createdUserIds.push(candidate.id);

    const reviewer = await prisma.user.create({
      data: {
        name: "Reviewer",
        email: `${crypto.randomUUID()}@reviewer.test`,
        passwordHash: "test-password-hash",
        role: "REVIEWER",
      },
    });

    createdUserIds.push(reviewer.id);

    const resume = await prisma.resume.create({
      data: {
        userId: candidate.id,
        fileName: "candidate.pdf",
        text: "Candidate resume text for review submission tests.",
        textHash: crypto
          .createHash("sha256")
          .update(crypto.randomUUID())
          .digest("hex"),
      },
    });

    createdResumeIds.push(resume.id);

    const career = await prisma.career.create({
      data: {
        slug: `review-submit-${crypto.randomUUID()}`,
        name: "Review Submit Test Career",
        description: "Career used for review submission tests.",
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
          ],
        },
      },
    });

    createdCareerIds.push(career.id);

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
          skills: ["Docker"],
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

  async function claimTask(taskId: string, reviewerId: string) {
    await claimReviewTask(taskId, reviewerId);
  }

  it("submits review and completes the analysis", async () => {
    const { reviewer, analysis, task } = await createReviewTask();

    await claimTask(task.id, reviewer.id);

    await submitReview(task.id, reviewer.id, {
      finalMatchPercentage: 100,
      finalMatchedSkills: ["Node.js", "PostgreSQL", "Docker"],
      finalMissingSkills: [],
      comment: "Docker experience was present in the resume.",
    });

    const updatedAnalysis = await prisma.analysis.findUnique({
      where: {
        id: analysis.id,
      },
    });

    expect(updatedAnalysis).not.toBeNull();

    expect(updatedAnalysis?.status).toBe("COMPLETED");

    expect(updatedAnalysis?.finalMatchPercentage).toBe(100);

    expect(updatedAnalysis?.finalMatchedSkills).toEqual({
      skills: ["Node.js", "PostgreSQL", "Docker"],
    });

    expect(updatedAnalysis?.finalMissingSkills).toEqual({
      skills: [],
    });

    const updatedTask = await prisma.reviewTask.findUnique({
      where: {
        id: task.id,
      },
    });

    expect(updatedTask?.status).toBe("COMPLETED");

    expect(updatedTask?.lockedById).toBeNull();
    expect(updatedTask?.lockExpiresAt).toBeNull();
    expect(updatedTask?.completedAt).not.toBeNull();
  });

  it("creates a Review containing the original AI result", async () => {
    const { reviewer, task } = await createReviewTask();

    await claimTask(task.id, reviewer.id);

    await submitReview(task.id, reviewer.id, {
      finalMatchPercentage: 100,
      finalMatchedSkills: ["Node.js", "PostgreSQL", "Docker"],
      finalMissingSkills: [],
      comment: "Verified.",
    });

    const review = await prisma.review.findUnique({
      where: {
        reviewTaskId: task.id,
      },
    });

    expect(review).not.toBeNull();

    expect(review?.reviewerId).toBe(reviewer.id);

    expect(review?.originalMatchPercentage).toBe(66.67);

    expect(review?.originalMatchedSkills).toEqual({
      skills: ["Node.js", "PostgreSQL"],
    });

    expect(review?.originalMissingSkills).toEqual({
      skills: ["Docker"],
    });

    expect(review?.finalMatchPercentage).toBe(100);

    expect(review?.finalMatchedSkills).toEqual({
      skills: ["Node.js", "PostgreSQL", "Docker"],
    });

    expect(review?.finalMissingSkills).toEqual({
      skills: [],
    });

    expect(review?.comment).toBe("Verified.");

    expect(review?.reviewTaskId).toBe(task.id);

    expect(review?.reviewerId).toBe(reviewer.id);

    expect(review?.originalMatchPercentage).toBe(66.67);
  });

  it("rejects submission by a different reviewer", async () => {
    const { reviewer, task } = await createReviewTask();

    const otherReviewer = await prisma.user.create({
      data: {
        name: "Other Reviewer",
        email: `${crypto.randomUUID()}@reviewer.test`,
        passwordHash: "test-password-hash",
        role: "REVIEWER",
      },
    });

    createdUserIds.push(otherReviewer.id);

    await claimTask(task.id, reviewer.id);

    await expect(
      submitReview(task.id, otherReviewer.id, {
        finalMatchPercentage: 50,
        finalMatchedSkills: ["Node.js"],
        finalMissingSkills: ["PostgreSQL", "Docker"],
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "REVIEW_TASK_NOT_OWNER",
    });
  });

  it("rejects submission when task is not locked", async () => {
    const { reviewer, task } = await createReviewTask();

    await expect(
      submitReview(task.id, reviewer.id, {
        finalMatchPercentage: 50,
        finalMatchedSkills: ["Node.js"],
        finalMissingSkills: ["PostgreSQL", "Docker"],
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_NOT_LOCKED",
    });
  });

  it("rejects submission after lock expiration", async () => {
    const { reviewer, task } = await createReviewTask();

    await claimTask(task.id, reviewer.id);

    await prisma.reviewTask.update({
      where: {
        id: task.id,
      },
      data: {
        lockExpiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    await expect(
      submitReview(task.id, reviewer.id, {
        finalMatchPercentage: 50,
        finalMatchedSkills: ["Node.js"],
        finalMissingSkills: ["PostgreSQL", "Docker"],
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_LOCK_EXPIRED",
    });

    const savedTask = await prisma.reviewTask.findUnique({
      where: {
        id: task.id,
      },
    });

    expect(savedTask?.status).toBe("LOCKED");

    expect(savedTask?.lockedById).toBe(reviewer.id);
  });

  it("rejects submission for a completed task", async () => {
    const { reviewer, task } = await createReviewTask();

    await prisma.reviewTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await expect(
      submitReview(task.id, reviewer.id, {
        finalMatchPercentage: 100,
        finalMatchedSkills: ["Node.js", "PostgreSQL", "Docker"],
        finalMissingSkills: [],
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_COMPLETED",
    });
  });

  it("rejects an unknown review task", async () => {
    const reviewer = await prisma.user.create({
      data: {
        name: "Reviewer",
        email: `${crypto.randomUUID()}@reviewer.test`,
        passwordHash: "test-password-hash",
        role: "REVIEWER",
      },
    });

    createdUserIds.push(reviewer.id);

    await expect(
      submitReview(crypto.randomUUID(), reviewer.id, {
        finalMatchPercentage: 50,
        finalMatchedSkills: ["Node.js"],
        finalMissingSkills: ["PostgreSQL"],
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "REVIEW_TASK_NOT_FOUND",
    });
  });

  it("prevents submitting the same task twice", async () => {
    const { reviewer, task } = await createReviewTask();

    await claimTask(task.id, reviewer.id);

    const input = {
      finalMatchPercentage: 100,
      finalMatchedSkills: ["Node.js", "PostgreSQL", "Docker"],
      finalMissingSkills: [],
    };

    await submitReview(task.id, reviewer.id, input);

    await expect(
      submitReview(task.id, reviewer.id, input),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_COMPLETED",
    });

    const reviews = await prisma.review.findMany({
      where: {
        reviewTaskId: task.id,
      },
    });

    expect(reviews).toHaveLength(1);
  });
});

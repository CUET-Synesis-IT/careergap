import crypto from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "../src/config/database";
import {
  connectRedis,
  disconnectRedis,
  redis,
} from "../src/config/redis";
import {
  claimReviewTask,
  getOpenReviewTasks,
  getReviewTask,
} from "../src/services/review.service";

describe("Review Task Locking", () => {
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

  async function createReviewer(name: string) {
    const reviewer = await prisma.user.create({
      data: {
        name,
        email: `${crypto.randomUUID()}@reviewer.test`,
        passwordHash: "test-password-hash",
        role: "REVIEWER",
      },
    });

    createdUserIds.push(reviewer.id);

    return reviewer;
  }

  async function createOpenReviewTask() {
    const user = await prisma.user.create({
      data: {
        name: "Candidate",
        email: `${crypto.randomUUID()}@candidate.test`,
        passwordHash: "test-password-hash",
        role: "USER",
      },
    });

    createdUserIds.push(user.id);

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: "candidate.pdf",
        text: "Candidate resume text for review locking tests.",
        textHash: crypto
          .createHash("sha256")
          .update(crypto.randomUUID())
          .digest("hex"),
      },
    });

    createdResumeIds.push(resume.id);

    const career = await prisma.career.create({
      data: {
        slug: `review-lock-${crypto.randomUUID()}`,
        name: "Review Lock Test Career",
        description: "Career used for review locking tests.",
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

    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        careerId: career.id,
        extractedSkills: {
          skills: ["Node.js"],
        },
        aiMatchPercentage: 100,
        aiMatchedSkills: {
          skills: ["Node.js"],
        },
        aiMissingSkills: {
          skills: [],
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

    return task;
  }

  it("allows a reviewer to claim an OPEN task", async () => {
    const task = await createOpenReviewTask();
    const reviewer = await createReviewer(
      "Reviewer One",
    );

    const result = await claimReviewTask(
      task.id,
      reviewer.id,
    );

    expect(result.id).toBe(task.id);
    expect(result.status).toBe("LOCKED");
    expect(result.lockedById).toBe(reviewer.id);
    expect(result.lockExpiresAt).not.toBeNull();

    const savedTask =
      await prisma.reviewTask.findUnique({
        where: {
          id: task.id,
        },
      });

    expect(savedTask?.status).toBe("LOCKED");
    expect(savedTask?.lockedById).toBe(reviewer.id);
  });

  it("sets the lock expiration approximately 15 minutes ahead", async () => {
    const task = await createOpenReviewTask();
    const reviewer = await createReviewer(
      "Reviewer One",
    );

    const beforeClaim = Date.now();

    const result = await claimReviewTask(
      task.id,
      reviewer.id,
    );

    const afterClaim = Date.now();

    expect(result.lockExpiresAt).not.toBeNull();

    const expiresAt =
      result.lockExpiresAt!.getTime();

    const minimumExpected =
      beforeClaim + 14 * 60 * 1000;

    const maximumExpected =
      afterClaim + 16 * 60 * 1000;

    expect(expiresAt).toBeGreaterThanOrEqual(
      minimumExpected,
    );

    expect(expiresAt).toBeLessThanOrEqual(
      maximumExpected,
    );
  });

  it("prevents a second reviewer from claiming an active lock", async () => {
    const task = await createOpenReviewTask();

    const reviewerOne = await createReviewer(
      "Reviewer One",
    );

    const reviewerTwo = await createReviewer(
      "Reviewer Two",
    );

    await claimReviewTask(
      task.id,
      reviewerOne.id,
    );

    await expect(
      claimReviewTask(
        task.id,
        reviewerTwo.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_LOCKED",
    });

    const savedTask =
      await prisma.reviewTask.findUnique({
        where: {
          id: task.id,
        },
      });

    expect(savedTask?.lockedById).toBe(
      reviewerOne.id,
    );
  });

  it("allows another reviewer to reclaim an expired lock", async () => {
    const task = await createOpenReviewTask();

    const reviewerOne = await createReviewer(
      "Reviewer One",
    );

    const reviewerTwo = await createReviewer(
      "Reviewer Two",
    );

    await prisma.reviewTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: "LOCKED",
        lockedById: reviewerOne.id,
        lockExpiresAt: new Date(
          Date.now() - 60 * 1000,
        ),
      },
    });

    const result = await claimReviewTask(
      task.id,
      reviewerTwo.id,
    );

    expect(result.status).toBe("LOCKED");
    expect(result.lockedById).toBe(
      reviewerTwo.id,
    );
    expect(result.lockExpiresAt).not.toBeNull();
  });

  it("does not allow claiming a completed task", async () => {
    const task = await createOpenReviewTask();
    const reviewer = await createReviewer(
      "Reviewer One",
    );

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
      claimReviewTask(
        task.id,
        reviewer.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_COMPLETED",
    });
  });

  it("returns 404 for an unknown task", async () => {
    const reviewer = await createReviewer(
      "Reviewer One",
    );

    await expect(
      claimReviewTask(
        crypto.randomUUID(),
        reviewer.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "REVIEW_TASK_NOT_FOUND",
    });
  });

  it("allows the current reviewer to access their locked task", async () => {
    const task = await createOpenReviewTask();

    const reviewer = await createReviewer(
      "Reviewer One",
    );

    await claimReviewTask(
      task.id,
      reviewer.id,
    );

    const result = await getReviewTask(
      task.id,
      reviewer.id,
    );

    expect(result.id).toBe(task.id);
    expect(result.status).toBe("LOCKED");
    expect(result.lockedById).toBe(reviewer.id);
  });

  it("rejects access by another reviewer while task is actively locked", async () => {
    const task = await createOpenReviewTask();

    const reviewerOne = await createReviewer(
      "Reviewer One",
    );

    const reviewerTwo = await createReviewer(
      "Reviewer Two",
    );

    await claimReviewTask(
      task.id,
      reviewerOne.id,
    );

    await expect(
      getReviewTask(
        task.id,
        reviewerTwo.id,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_TASK_LOCKED",
    });
  });

  it("reopens an expired task when reading task details", async () => {
    const task = await createOpenReviewTask();

    const reviewer = await createReviewer(
      "Reviewer One",
    );

    await prisma.reviewTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: "LOCKED",
        lockedById: reviewer.id,
        lockExpiresAt: new Date(
          Date.now() - 60 * 1000,
        ),
      },
    });

    const result = await getReviewTask(
      task.id,
      reviewer.id,
    );

    expect(result.status).toBe("OPEN");
    expect(result.lockedById).toBeNull();
    expect(result.lockExpiresAt).toBeNull();

    const savedTask =
      await prisma.reviewTask.findUnique({
        where: {
          id: task.id,
        },
      });

    expect(savedTask?.status).toBe("OPEN");
    expect(savedTask?.lockedById).toBeNull();
    expect(savedTask?.lockExpiresAt).toBeNull();
  });

  it("returns only OPEN tasks from the review queue", async () => {
    const openTask = await createOpenReviewTask();

    const lockedTask =
      await createOpenReviewTask();

    const completedTask =
      await createOpenReviewTask();

    const reviewer = await createReviewer(
      "Reviewer One",
    );

    await prisma.reviewTask.update({
      where: {
        id: lockedTask.id,
      },
      data: {
        status: "LOCKED",
        lockedById: reviewer.id,
        lockExpiresAt: new Date(
          Date.now() + 10 * 60 * 1000,
        ),
      },
    });

    await prisma.reviewTask.update({
      where: {
        id: completedTask.id,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    const tasks =
      await getOpenReviewTasks();

    const taskIds = tasks.map(
      (item) => item.id,
    );

    expect(taskIds).toContain(openTask.id);
    expect(taskIds).not.toContain(
      lockedTask.id,
    );
    expect(taskIds).not.toContain(
      completedTask.id,
    );
  });

  it("reclaims expired tasks when loading the queue", async () => {
    const task = await createOpenReviewTask();

    const reviewer = await createReviewer(
      "Reviewer One",
    );

    await prisma.reviewTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: "LOCKED",
        lockedById: reviewer.id,
        lockExpiresAt: new Date(
          Date.now() - 60 * 1000,
        ),
      },
    });

    const tasks =
      await getOpenReviewTasks();

    const reopened = tasks.find(
      (item) => item.id === task.id,
    );

    expect(reopened).toBeDefined();
    expect(reopened?.status).toBe("OPEN");
    expect(reopened?.lockedById).toBeNull();
  });
});

import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type { ReviewTaskResponse } from "../types/review";
import type { SubmitReviewInput } from "../validators/review.validator";

const REVIEW_LOCK_MINUTES = 15;

const reviewTaskSelect = {
  id: true,
  status: true,
  analysisId: true,
  lockedById: true,
  lockExpiresAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  analysis: {
    select: {
      id: true,
      resumeId: true,
      careerId: true,
      aiMatchPercentage: true,
      aiMatchedSkills: true,
      aiMissingSkills: true,
      extractedSkills: true,
      career: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          profile: true,
        },
      },
    },
  },
} as const;

function extractSkillArray(
  value: unknown,
): (string | { name: string; importance?: string })[] {
  if (
    typeof value === "object" &&
    value !== null &&
    "skills" in value &&
    Array.isArray(value.skills)
  ) {
    return value.skills
      .map((skill) => {
        if (typeof skill === "string") return skill;
        if (typeof skill === "object" && skill !== null && "name" in skill) {
          return {
            name: String(skill.name),
            ...("importance" in skill && skill.importance
              ? { importance: String(skill.importance) }
              : {}),
          };
        }
        return null;
      })
      .filter(
        (item): item is string | { name: string; importance?: string } =>
          item !== null,
      );
  }

  return [];
}

function extractRawStringSkills(value: unknown): string[] {
  if (
    typeof value === "object" &&
    value !== null &&
    "skills" in value &&
    Array.isArray(value.skills)
  ) {
    return value.skills.filter(
      (skill): skill is string => typeof skill === "string",
    );
  }

  return [];
}

function toReviewTaskResponse(task: {
  id: string;
  status: string;
  analysisId: string;
  lockedById: string | null;
  lockExpiresAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  analysis: {
    id: string;
    resumeId: string;
    careerId: string;
    extractedSkills: unknown;
    aiMatchPercentage: number | null;
    aiMatchedSkills: unknown;
    aiMissingSkills: unknown;
    career: {
      id: string;
      slug: string;
      name: string;
      description: string;
      profile?: unknown;
    };
  };
}): ReviewTaskResponse {
  const aiResult =
    task.analysis.aiMatchPercentage !== null
      ? {
          matchPercentage: task.analysis.aiMatchPercentage,
          matchedSkills: extractSkillArray(task.analysis.aiMatchedSkills),
          missingSkills: extractSkillArray(task.analysis.aiMissingSkills),
        }
      : null;

  return {
    id: task.id,
    status: task.status as ReviewTaskResponse["status"],
    analysisId: task.analysisId,
    lockedById: task.lockedById,
    lockExpiresAt: task.lockExpiresAt,
    completedAt: task.completedAt,
    analysis: {
      id: task.analysis.id,
      resumeId: task.analysis.resumeId,
      careerId: task.analysis.careerId,
      extractedSkills: extractRawStringSkills(task.analysis.extractedSkills),
      aiResult,
      career: task.analysis.career,
    },
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Return tasks currently available to reviewers.
 *
 * Available:
 *   OPEN
 *   OR LOCKED with expired lock
 */
export async function getOpenReviewTasks(
  reviewerId?: string,
): Promise<ReviewTaskResponse[]> {
  const now = new Date();

  // Lazily reopen expired tasks.
  await prisma.reviewTask.updateMany({
    where: {
      status: "LOCKED",
      lockExpiresAt: {
        lt: now,
      },
    },
    data: {
      status: "OPEN",
      lockedById: null,
      lockExpiresAt: null,
    },
  });

  const orConditions: import("@prisma/client").Prisma.ReviewTaskWhereInput[] = [
    { status: "OPEN" },
  ];

  if (reviewerId) {
    orConditions.push({
      status: "LOCKED",
      lockedById: reviewerId,
      lockExpiresAt: { gt: now },
    });
  }

  const tasks = await prisma.reviewTask.findMany({
    where: { OR: orConditions },
    select: reviewTaskSelect,
    orderBy: { createdAt: "asc" },
  });

  return tasks.map(toReviewTaskResponse);
}

/**
 * Atomically claim a review task.
 *
 * Only one concurrent reviewer can change the
 * task from OPEN/expired LOCKED to LOCKED.
 * If claimed by the same reviewer with an active lock,
 * the lock is renewed/maintained.
 */
export async function claimReviewTask(
  taskId: string,
  reviewerId: string,
): Promise<ReviewTaskResponse> {
  const now = new Date();

  const lockExpiresAt = new Date(
    now.getTime() + REVIEW_LOCK_MINUTES * 60 * 1000,
  );

  // First, reclaim this specific task if its
  // previous lock has expired.
  await prisma.reviewTask.updateMany({
    where: {
      id: taskId,
      status: "LOCKED",
      lockExpiresAt: {
        lt: now,
      },
    },
    data: {
      status: "OPEN",
      lockedById: null,
      lockExpiresAt: null,
    },
  });

  // Critical operation:
  //
  // Either a task currently OPEN can be locked,
  // or a task already locked by the SAME reviewer can be re-entered.
  const claimed = await prisma.reviewTask.updateMany({
    where: {
      id: taskId,
      OR: [
        { status: "OPEN" },
        {
          status: "LOCKED",
          lockedById: reviewerId,
          lockExpiresAt: {
            gt: now,
          },
        },
      ],
    },
    data: {
      status: "LOCKED",
      lockedById: reviewerId,
      lockExpiresAt,
    },
  });

  if (claimed.count === 0) {
    const task = await prisma.reviewTask.findUnique({
      where: {
        id: taskId,
      },
      select: {
        id: true,
        status: true,
        lockExpiresAt: true,
      },
    });

    if (!task) {
      throw new AppError(
        "Review task not found.",
        404,
        "REVIEW_TASK_NOT_FOUND",
      );
    }

    if (task.status === "COMPLETED") {
      throw new AppError(
        "Review task is already completed.",
        409,
        "REVIEW_TASK_COMPLETED",
      );
    }

    throw new AppError(
      "Review task is already locked or unavailable.",
      409,
      "REVIEW_TASK_LOCKED",
    );
  }

  const task = await prisma.reviewTask.findUnique({
    where: {
      id: taskId,
    },
    select: reviewTaskSelect,
  });

  if (!task) {
    throw new AppError("Review task not found.", 404, "REVIEW_TASK_NOT_FOUND");
  }

  return toReviewTaskResponse(task);
}

/**
 * Get a specific review task.
 */
export async function getReviewTask(
  taskId: string,
  reviewerId: string,
): Promise<ReviewTaskResponse> {
  const task = await prisma.reviewTask.findUnique({
    where: {
      id: taskId,
    },
    select: reviewTaskSelect,
  });

  if (!task) {
    throw new AppError("Review task not found.", 404, "REVIEW_TASK_NOT_FOUND");
  }

  const now = new Date();

  // Expired lock is no longer owned by anyone.
  if (
    task.status === "LOCKED" &&
    task.lockExpiresAt &&
    task.lockExpiresAt < now
  ) {
    await prisma.reviewTask.updateMany({
      where: {
        id: taskId,
        status: "LOCKED",
        lockExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: "OPEN",
        lockedById: null,
        lockExpiresAt: null,
      },
    });

    const reopened = await prisma.reviewTask.findUnique({
      where: {
        id: taskId,
      },
      select: reviewTaskSelect,
    });

    if (!reopened) {
      throw new AppError(
        "Review task not found.",
        404,
        "REVIEW_TASK_NOT_FOUND",
      );
    }

    return toReviewTaskResponse(reopened);
  }

  // Another reviewer owns the active lock.
  if (task.status === "LOCKED" && task.lockedById !== reviewerId) {
    throw new AppError(
      "Review task is locked by another reviewer.",
      409,
      "REVIEW_TASK_LOCKED",
    );
  }

  return toReviewTaskResponse(task);
}

/**
 * Submit human-reviewed result.
 *
 * This is intentionally implemented as a short
 * PostgreSQL transaction. No external API call
 * occurs inside it.
 */
export async function submitReview(
  taskId: string,
  reviewerId: string,
  input: SubmitReviewInput,
): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const task = await tx.reviewTask.findUnique({
      where: {
        id: taskId,
      },
      select: {
        id: true,
        status: true,
        analysisId: true,
        lockedById: true,
        lockExpiresAt: true,
        analysis: {
          select: {
            id: true,
            aiMatchPercentage: true,
            aiMatchedSkills: true,
            aiMissingSkills: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError(
        "Review task not found.",
        404,
        "REVIEW_TASK_NOT_FOUND",
      );
    }

    if (task.status === "COMPLETED") {
      throw new AppError(
        "Review task is already completed.",
        409,
        "REVIEW_TASK_COMPLETED",
      );
    }

    if (task.status !== "LOCKED") {
      throw new AppError(
        "Review task must be locked before submission.",
        409,
        "REVIEW_TASK_NOT_LOCKED",
      );
    }

    if (task.lockedById !== reviewerId) {
      throw new AppError(
        "You do not own this review task.",
        403,
        "REVIEW_TASK_NOT_OWNER",
      );
    }

    if (!task.lockExpiresAt || task.lockExpiresAt <= now) {
      throw new AppError(
        "Review task lock has expired. Please claim the task again.",
        409,
        "REVIEW_TASK_LOCK_EXPIRED",
      );
    }

    // Preserve original AI result.
    await tx.review.create({
      data: {
        reviewTaskId: task.id,
        reviewerId,
        originalMatchPercentage: task.analysis.aiMatchPercentage,
        originalMatchedSkills: task.analysis.aiMatchedSkills ?? undefined,
        originalMissingSkills: task.analysis.aiMissingSkills ?? undefined,
        finalMatchPercentage: input.finalMatchPercentage,
        finalMatchedSkills: {
          skills: input.finalMatchedSkills,
        },
        finalMissingSkills: {
          skills: input.finalMissingSkills,
        },
        comment: input.comment,
      },
    });

    // Save reviewer-approved result.
    await tx.analysis.update({
      where: {
        id: task.analysisId,
      },
      data: {
        finalMatchPercentage: input.finalMatchPercentage,
        finalMatchedSkills: {
          skills: input.finalMatchedSkills,
        },
        finalMissingSkills: {
          skills: input.finalMissingSkills,
        },
        status: "COMPLETED",
      },
    });

    // Complete task and clear lock.
    await tx.reviewTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: "COMPLETED",
        lockedById: null,
        lockExpiresAt: null,
        completedAt: now,
      },
    });
  });
}

/**
 * Voluntarily release a task lock so other reviewers
 * can pick it up immediately without waiting for the
 * 15-minute natural expiry.
 *
 * Only the reviewer who owns the active lock may release it.
 */
export async function releaseReviewTask(
  taskId: string,
  reviewerId: string,
): Promise<void> {
  const now = new Date();

  const released = await prisma.reviewTask.updateMany({
    where: {
      id: taskId,
      status: "LOCKED",
      lockedById: reviewerId,
      lockExpiresAt: {
        gt: now,
      },
    },
    data: {
      status: "OPEN",
      lockedById: null,
      lockExpiresAt: null,
    },
  });

  if (released.count === 0) {
    // Check whether the task even exists / belongs to someone else
    const task = await prisma.reviewTask.findUnique({
      where: { id: taskId },
      select: { id: true, status: true, lockedById: true },
    });

    if (!task) {
      throw new AppError(
        "Review task not found.",
        404,
        "REVIEW_TASK_NOT_FOUND",
      );
    }

    if (task.status === "COMPLETED") {
      throw new AppError(
        "Review task is already completed.",
        409,
        "REVIEW_TASK_COMPLETED",
      );
    }

    if (task.lockedById !== reviewerId) {
      throw new AppError(
        "You do not own this review task.",
        403,
        "REVIEW_TASK_NOT_OWNER",
      );
    }

    // Lock already expired — treat as success (task is already OPEN)
  }
}

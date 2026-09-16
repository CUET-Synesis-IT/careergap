import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type {
  CreateReviewerInput,
  UpdateReviewerInput,
} from "../validators/admin.validator";

const reviewerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function getReviewers() {
  return prisma.user.findMany({
    where: {
      role: "REVIEWER",
    },
    select: reviewerSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createReviewer(input: CreateReviewerInput) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError(
      "A user with this email already exists.",
      409,
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: "REVIEWER",
    },
    select: reviewerSelect,
  });
}

export async function updateReviewer(
  reviewerId: string,
  input: UpdateReviewerInput,
) {
  const reviewer = await prisma.user.findUnique({
    where: {
      id: reviewerId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!reviewer || reviewer.role !== "REVIEWER") {
    throw new AppError(
      "Reviewer not found.",
      404,
      "REVIEWER_NOT_FOUND",
    );
  }

  return prisma.user.update({
    where: {
      id: reviewerId,
    },
    data: {
      isActive: input.isActive,
    },
    select: reviewerSelect,
  });
}

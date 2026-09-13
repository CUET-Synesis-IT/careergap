import bcrypt from "bcrypt";

import { prisma } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import {
  generateAccessToken,
} from "../utils/jwt";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "REVIEWER" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: Date;
}

export interface LoginResult {
  user: SafeUser;
  accessToken: string;
}

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function register(
  input: RegisterInput,
): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists.",
      409,
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    env.BCRYPT_ROUNDS,
  );

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "USER",
      },
      select: safeUserSelect,
    });

    return user;
  } catch (error) {
    // Protect against race condition where two requests
    // check the same email simultaneously.
    if (isPrismaUniqueConstraintError(error)) {
      throw new AppError(
        "An account with this email already exists.",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

export async function login(
  input: LoginInput,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "This account is inactive.",
      401,
      "ACCOUNT_INACTIVE",
    );
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    accessToken,
  };
}

export async function getCurrentUser(
  userId: string,
): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: safeUserSelect,
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "Authentication required.",
      401,
      "UNAUTHORIZED",
    );
  }

  return user;
}

function isPrismaUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

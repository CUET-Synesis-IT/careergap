import type { RequestHandler } from "express";

import { prisma } from "../config/database";
import { AppError } from "./error.middleware";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED",
      );
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        "Invalid authorization header.",
        401,
        "INVALID_TOKEN",
      );
    }

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(
        "Invalid or expired access token.",
        401,
        "INVALID_TOKEN",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED",
      );
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

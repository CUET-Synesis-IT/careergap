import type { RequestHandler } from "express";

import { AppError } from "./error.middleware";
import type { UserRole } from "../types";

export function requireRole(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new AppError(
          "Authentication required.",
          401,
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          "You do not have permission to perform this action.",
          403,
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}

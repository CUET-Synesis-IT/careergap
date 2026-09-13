import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError } from "./error.middleware";

export const validate = <T>(
  schema: ZodType<T>,
  target: "body" | "params" | "query",
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      next(
        new AppError("Invalid request data", 422, "VALIDATION_ERROR", details),
      );

      return;
    }

    req[target] = result.data;

    next();
  };
};

import type { RequestHandler } from "express";
import { AppError } from "./error.middleware";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND",
    ),
  );
};

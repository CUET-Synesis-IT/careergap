import type { ErrorRequestHandler } from "express";
import { sendError } from "../utils/response";

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown,
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  console.error(error);

  if (error instanceof AppError) {
    const message =
      error.statusCode >= 500
        ? "An unexpected error occurred."
        : error.message;

    sendError(
      res,
      message,
      error.code,
      error.statusCode,
      error.details,
    );

    return;
  }

  sendError(
    res,
    "An unexpected error occurred.",
    "INTERNAL_SERVER_ERROR",
    500,
  );
};

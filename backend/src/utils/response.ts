import type { Response } from "express";

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  code: string,
  statusCode: number,
  details?: unknown,
): Response<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    message,
    code,
  };

  if (details !== undefined) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
}

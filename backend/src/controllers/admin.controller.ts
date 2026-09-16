import type { NextFunction, Request, Response } from "express";
import {
  getReviewers,
  createReviewer,
  updateReviewer,
} from "../services/admin.service";
import type {
  CreateReviewerInput,
  UpdateReviewerInput,
} from "../validators/admin.validator";
import { sendSuccess } from "../utils/response";

export async function getReviewersController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviewers = await getReviewers();

    sendSuccess(res, { reviewers }, 200);
  } catch (error) {
    next(error);
  }
}

export async function createReviewerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateReviewerInput;

    const reviewer = await createReviewer(input);

    sendSuccess(res, { reviewer }, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateReviewerController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateReviewerInput;

    const reviewer = await updateReviewer(id, input);

    sendSuccess(res, { reviewer }, 200);
  } catch (error) {
    next(error);
  }
}

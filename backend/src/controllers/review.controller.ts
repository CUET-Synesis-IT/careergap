import type { NextFunction, Request, Response } from "express";
import {
  getOpenReviewTasks,
  claimReviewTask,
  getReviewTask,
  submitReview,
} from "../services/review.service";
import type { SubmitReviewInput } from "../validators/review.validator";
import { sendSuccess } from "../utils/response";

export async function getOpenReviewTasksController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tasks = await getOpenReviewTasks();

    sendSuccess(res, tasks, 200);
  } catch (error) {
    next(error);
  }
}

export async function claimReviewTaskController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const { id } = req.params;

    const task = await claimReviewTask(id, reviewerId);

    sendSuccess(res, task, 200);
  } catch (error) {
    next(error);
  }
}

export async function getReviewTaskController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const { id } = req.params;

    const task = await getReviewTask(id, reviewerId);

    sendSuccess(res, task, 200);
  } catch (error) {
    next(error);
  }
}

export async function submitReviewController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const { id } = req.params;
    const input = req.body as SubmitReviewInput;

    const result = await submitReview(id, reviewerId, input);

    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
}

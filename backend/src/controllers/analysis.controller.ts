import type { NextFunction, Request, Response } from "express";
import {
  createAnalysis,
  getUserAnalyses,
  getAnalysisById,
} from "../services/analysis.service";
import type { CreateAnalysisInput } from "../validators/analysis.validator";
import { sendSuccess } from "../utils/response";

export async function createAnalysisController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { resumeId, careerId } = req.body as CreateAnalysisInput;

    const analysis = await createAnalysis(userId, resumeId, careerId);

    sendSuccess(res, analysis, 201);
  } catch (error) {
    next(error);
  }
}

export async function getAnalysesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;

    const analyses = await getUserAnalyses(userId);

    sendSuccess(res, analyses, 200);
  } catch (error) {
    next(error);
  }
}

export async function getAnalysisByIdController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const analysis = await getAnalysisById(userId, id);

    sendSuccess(res, analysis, 200);
  } catch (error) {
    next(error);
  }
}

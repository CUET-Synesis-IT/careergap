import type { RequestHandler } from "express";
import { createResume, getResumeById } from "../services/resume.service";
import { sendSuccess } from "../utils/response";

export const uploadResume: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Authenticated user missing from request.");
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Resume file is required.",
        code: "FILE_REQUIRED",
      });
      return;
    }

    const resume = await createResume(
      req.user.id,
      req.file.originalname,
      req.file.buffer,
    );

    sendSuccess(res, { resume }, 201);
  } catch (error) {
    next(error);
  }
};

export const getResume: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("Authenticated user missing from request.");
    }

    const resumeId = req.params.id;

    if (typeof resumeId !== "string") {
      throw new Error("Invalid resume ID.");
    }

    const resume = await getResumeById(req.user.id, resumeId);

    sendSuccess(res, { resume });
  } catch (error) {
    next(error);
  }
};

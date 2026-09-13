import type { RequestHandler } from "express";

import {
  getCareerById,
  getCareers,
} from "../services/career.service";
import { sendSuccess } from "../utils/response";

export const listCareers: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const careers = await getCareers();

    sendSuccess(res, { careers });
  } catch (error) {
    next(error);
  }
};

export const getCareer: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const careerId = req.params.id;

    if (typeof careerId !== "string") {
      throw new Error("Invalid career ID.");
    }

    const career = await getCareerById(careerId);

    sendSuccess(res, { career });
  } catch (error) {
    next(error);
  }
};

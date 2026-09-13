import type { RequestHandler } from "express";

import {
  getCurrentUser,
  login as loginUser,
  register as registerUser,
} from "../services/auth.service";
import { sendSuccess } from "../utils/response";

export const register: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const user = await registerUser(req.body);

    sendSuccess(res, { user }, 201);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const result = await loginUser(req.body);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.user) {
      throw new Error("Authenticated user missing from request.");
    }

    const user = await getCurrentUser(req.user.id);

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    sendSuccess(res, {
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

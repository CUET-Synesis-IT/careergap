import { Router } from "express";

import {
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  validate(registerSchema, "body"),
  register,
);

router.post(
  "/login",
  validate(loginSchema, "body"),
  login,
);

router.get(
  "/me",
  authenticate,
  me,
);

router.post(
  "/logout",
  authenticate,
  logout,
);

export default router;

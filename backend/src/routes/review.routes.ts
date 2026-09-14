import { Router } from "express";
import {
  getOpenReviewTasksController,
  claimReviewTaskController,
  getReviewTaskController,
  submitReviewController,
} from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  reviewTaskIdParamsSchema,
  submitReviewSchema,
} from "../validators/review.validator";

const router = Router();

router.use(authenticate);
router.use(requireRole("REVIEWER"));

router.get("/tasks", getOpenReviewTasksController);

router.post(
  "/tasks/:id/claim",
  validate(reviewTaskIdParamsSchema, "params"),
  claimReviewTaskController,
);

router.get(
  "/tasks/:id",
  validate(reviewTaskIdParamsSchema, "params"),
  getReviewTaskController,
);

router.post(
  "/tasks/:id/submit",
  validate(reviewTaskIdParamsSchema, "params"),
  validate(submitReviewSchema, "body"),
  submitReviewController,
);

export default router;

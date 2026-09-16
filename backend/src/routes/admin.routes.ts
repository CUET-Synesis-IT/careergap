import { Router } from "express";
import {
  getReviewersController,
  createReviewerController,
  updateReviewerController,
} from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createReviewerSchema,
  updateReviewerSchema,
  reviewerIdParamsSchema,
} from "../validators/admin.validator";

const router = Router();

router.use(authenticate);
router.use(requireRole("SUPER_ADMIN"));

router.get("/reviewers", getReviewersController);

router.post(
  "/reviewers",
  validate(createReviewerSchema, "body"),
  createReviewerController,
);

router.patch(
  "/reviewers/:id",
  validate(reviewerIdParamsSchema, "params"),
  validate(updateReviewerSchema, "body"),
  updateReviewerController,
);

export default router;

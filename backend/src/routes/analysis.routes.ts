import { Router } from "express";
import {
  createAnalysisController,
  getAnalysesController,
  getAnalysisByIdController,
} from "../controllers/analysis.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  analysisIdParamsSchema,
  createAnalysisSchema,
} from "../validators/analysis.validator";

const router = Router();

router.use(authenticate);
router.use(requireRole("USER"));

router.post(
  "/",
  validate(createAnalysisSchema, "body"),
  createAnalysisController,
);

router.get("/", getAnalysesController);

router.get(
  "/:id",
  validate(analysisIdParamsSchema, "params"),
  getAnalysisByIdController,
);

export default router;

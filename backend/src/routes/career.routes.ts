import { Router } from "express";

import {
  getCareer,
  listCareers,
} from "../controllers/career.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("USER"),
  listCareers,
);

router.get(
  "/:id",
  authenticate,
  requireRole("USER"),
  getCareer,
);

export default router;

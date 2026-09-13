import { Router } from "express";
import {
  getResume,
  uploadResume,
} from "../controllers/resume.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadResume as uploadResumeFile } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRole("USER"),
  uploadResumeFile,
  uploadResume,
);

router.get(
  "/:id",
  authenticate,
  requireRole("USER"),
  getResume,
);

export default router;

import { Router } from "express";

import authRouter from "./auth.routes";
import resumeRouter from "./resume.routes";
import careerRouter from "./career.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/resumes", resumeRouter);
router.use("/careers", careerRouter);

export default router;

import { Router } from "express";
import authRouter from "./auth.routes";
import resumeRouter from "./resume.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/resumes", resumeRouter);

export default router;

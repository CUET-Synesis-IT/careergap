import { Router } from "express";

import authRouter from "./auth.routes";
import resumeRouter from "./resume.routes";
import careerRouter from "./career.routes";
import analysisRouter from "./analysis.routes";
import reviewRouter from "./review.routes";
import adminRouter from "./admin.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/resumes", resumeRouter);
router.use("/careers", careerRouter);
router.use("/analyses", analysisRouter);
router.use("/reviews", reviewRouter);
router.use("/admin", adminRouter);

export default router;

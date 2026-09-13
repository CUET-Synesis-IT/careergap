import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { checkHealth } from "./services/health.service";
import apiRouter from "./routes";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res, next) => {
  try {
    const health = await checkHealth();

    const statusCode = health.status === "ok" ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === "ok",
      data: health,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;

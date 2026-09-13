import { prisma } from "../config/database";
import { redis } from "../config/redis";

export interface HealthStatus {
  status: "ok" | "degraded";
  database: "ok" | "error";
  redis: "ok" | "error";
}

export async function checkHealth(): Promise<HealthStatus> {
  const [database, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const isHealthy = database === "ok" && redisStatus === "ok";

  return {
    status: isHealthy ? "ok" : "degraded",
    database,
    redis: redisStatus,
  };
}

async function checkDatabase(): Promise<"ok" | "error"> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch (error) {
    console.error("Health check - PostgreSQL:", error);
    return "error";
  }
}

async function checkRedis(): Promise<"ok" | "error"> {
  try {
    if (!redis.isReady) {
      return "error";
    }

    await redis.ping();

    return "ok";
  } catch (error) {
    console.error("Health check - Redis:", error);
    return "error";
  }
}

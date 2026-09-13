import { createClient } from "redis";
import { env } from "./env";

export const redis = createClient({
  url: env.REDIS_URL,
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export async function connectRedis(): Promise<void> {
  if (redis.isOpen) {
    return;
  }

  await redis.connect();

  console.log("Redis connected");
}

export async function disconnectRedis(): Promise<void> {
  if (!redis.isOpen) {
    return;
  }

  await redis.quit();

  console.log("Redis disconnected");
}

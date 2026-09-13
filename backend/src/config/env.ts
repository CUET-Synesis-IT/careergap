import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z.string().min(1).default("15m"),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  AI_PROVIDER: z.string().default("gemini"),

  AI_API_KEY: z.string().default(""),

  AI_MODEL: z.string().default(""),

  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  CAREER_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),

  CAREER_LOCK_TTL_SECONDS: z.coerce.number().int().positive().default(30),

  REVIEW_LOCK_MINUTES: z.coerce.number().int().positive().default(15),

  MAX_RESUME_SIZE_MB: z.coerce.number().positive().default(5),

  MAX_RESUME_TEXT_CHARS: z.coerce.number().int().positive().default(50000),

  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),

  ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),

  ADMIN_PASSWORD: z.string().optional().or(z.literal("")),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");

  console.error(
    parsedEnv.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );

  process.exit(1);
}

export const env = parsedEnv.data;

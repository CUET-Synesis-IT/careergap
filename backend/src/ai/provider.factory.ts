import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import { GeminiProvider } from "./gemini.provider";
import type { AIProvider } from "./provider";

let provider: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (provider) {
    return provider;
  }

  switch (env.AI_PROVIDER) {
    case "gemini":
      provider = new GeminiProvider();
      return provider;

    default:
      throw new AppError(
        `Unsupported AI provider: ${env.AI_PROVIDER}`,
        500,
        "UNSUPPORTED_AI_PROVIDER",
      );
  }
}

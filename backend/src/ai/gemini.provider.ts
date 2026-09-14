import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import {
  careerProfileSchema,
  type ValidatedCareerProfile,
} from "./career-profile.schema";
import type {
  AIProvider,
  CareerProfileGenerationInput,
} from "./provider";
import { resumeSkillExtractionSchema } from "./skill-extraction.schema";
import type {
  ResumeSkillExtractionInput,
  ResumeSkillExtractionResult,
} from "./provider";

export class GeminiProvider implements AIProvider {
  async generateCareerProfile(
    input: CareerProfileGenerationInput,
  ): Promise<ValidatedCareerProfile> {
    if (!env.AI_API_KEY) {
      throw new AppError(
        "AI provider is not configured.",
        503,
        "AI_PROVIDER_NOT_CONFIGURED",
      );
    }

    if (!env.AI_MODEL) {
      throw new AppError(
        "AI model is not configured.",
        503,
        "AI_MODEL_NOT_CONFIGURED",
      );
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(env.AI_MODEL)}:generateContent` +
      `?key=${encodeURIComponent(env.AI_API_KEY)}`;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, env.AI_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildPrompt(input),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Gemini API request failed:", response.status, errorText);

        throw new AppError(
          "AI provider request failed.",
          502,
          "AI_PROVIDER_ERROR",
        );
      }

      const data = (await response.json()) as GeminiResponse;

      const text = extractGeminiText(data);

      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch {
        throw new AppError(
          "AI provider returned invalid JSON.",
          502,
          "AI_INVALID_RESPONSE",
        );
      }

      const validation = careerProfileSchema.safeParse(parsed);

      if (!validation.success) {
        console.error(
          "Invalid career profile from Gemini:",
          validation.error.issues,
        );

        throw new AppError(
          "AI provider returned an invalid career profile.",
          502,
          "AI_INVALID_PROFILE",
        );
      }

      return validation.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(
          "AI provider request timed out.",
          504,
          "AI_PROVIDER_TIMEOUT",
        );
      }

      console.error("Gemini provider request failed:", error);

      throw new AppError(
        "Unable to contact AI provider.",
        502,
        "AI_PROVIDER_ERROR",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async extractResumeSkills(
    input: ResumeSkillExtractionInput,
  ): Promise<ResumeSkillExtractionResult> {
    if (!env.AI_API_KEY) {
      throw new AppError(
        "AI API key is not configured.",
        503,
        "AI_NOT_CONFIGURED",
      );
    }

    if (!env.AI_MODEL) {
      throw new AppError(
        "AI model is not configured.",
        503,
        "AI_NOT_CONFIGURED",
      );
    }

    const prompt = `
Extract technical and professional skills explicitly supported by this resume.

Rules:
- Extract only skills supported by the resume text.
- Do not invent or infer skills.
- Normalize obvious variations such as "Node JS" to "Node.js".
- Do not calculate a match percentage.
- Do not identify missing skills.
- Do not provide recommendations.
- Do not include explanations.
- Do not include duplicate skills.
- Return only JSON matching this structure:

{
  "skills": ["Skill 1", "Skill 2"]
}

Resume:
${input.resumeText}
`.trim();

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, env.AI_TIMEOUT_MS);

    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${env.AI_MODEL}:generateContent?key=${env.AI_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Gemini skill extraction failed:",
          response.status,
          errorText,
        );

        throw new AppError(
          "AI provider request failed.",
          502,
          "AI_PROVIDER_ERROR",
        );
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new AppError(
          "AI provider returned an empty response.",
          502,
          "AI_EMPTY_RESPONSE",
        );
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(generatedText);
      } catch (error) {
        console.error("Gemini returned invalid JSON:", error);

        throw new AppError(
          "AI provider returned invalid JSON.",
          502,
          "AI_INVALID_RESPONSE",
        );
      }

      const validated = resumeSkillExtractionSchema.safeParse(parsed);

      if (!validated.success) {
        console.error("Gemini returned invalid skill data:", validated.error);

        throw new AppError(
          "AI provider returned an invalid skill response.",
          502,
          "AI_INVALID_PROFILE",
        );
      }

      return validated.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(
          "AI provider request timed out.",
          504,
          "AI_PROVIDER_TIMEOUT",
        );
      }

      console.error("Gemini skill extraction error:", error);

      throw new AppError(
        "AI provider request failed.",
        502,
        "AI_PROVIDER_ERROR",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildPrompt(
  input: CareerProfileGenerationInput,
): string {
  return `
Generate a concise skill profile for the following software engineering career.

Career:
${input.careerName}

Description:
${input.careerDescription}

Return ONLY valid JSON in exactly this structure:

{
  "skills": [
    {
      "name": "skill name",
      "importance": "HIGH"
    }
  ]
}

Rules:
- Include relevant technical and engineering skills.
- Importance must be exactly HIGH, MEDIUM, or LOW.
- Do not include explanations.
- Do not include markdown.
- Do not include fields other than "skills".
`.trim();
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function extractGeminiText(
  response: GeminiResponse,
): string {
  const text =
    response.candidates?.[0]?.content?.parts?.[0]
      ?.text;

  if (!text) {
    throw new AppError(
      "AI provider returned an empty response.",
      502,
      "AI_EMPTY_RESPONSE",
    );
  }

  return text.trim();
}

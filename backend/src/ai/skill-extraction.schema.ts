import { z } from "zod";

export const resumeSkillExtractionSchema = z.object({
  skills: z
    .array(
      z
        .string()
        .trim()
        .min(1),
    )
    .max(100),
});

export type ValidatedResumeSkillExtraction = z.infer<
  typeof resumeSkillExtractionSchema
>;

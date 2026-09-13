import { z } from "zod";

export const careerProfileSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        importance: z.enum([
          "HIGH",
          "MEDIUM",
          "LOW",
        ]),
      }),
    )
    .min(1),
});

export type ValidatedCareerProfile = z.infer<
  typeof careerProfileSchema
>;

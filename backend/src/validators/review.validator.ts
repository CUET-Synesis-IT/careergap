import { z } from "zod";

export const submitReviewSchema = z.object({
  finalMatchPercentage: z.number().min(0).max(100),

  finalMatchedSkills: z.array(z.string().trim().min(1)).max(100),

  finalMissingSkills: z.array(z.string().trim().min(1)).max(100),

  comment: z.string().trim().max(2000).optional(),
});

export const reviewTaskIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

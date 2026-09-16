import { z } from "zod";

export const createReviewerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export const updateReviewerSchema = z.object({
  isActive: z.boolean(),
});

export const reviewerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateReviewerInput = z.infer<typeof createReviewerSchema>;
export type UpdateReviewerInput = z.infer<typeof updateReviewerSchema>;

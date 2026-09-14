import { z } from "zod";

export const createAnalysisSchema = z.object({
  resumeId: z.string().uuid(),
  careerId: z.string().uuid(),
});

export const analysisIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

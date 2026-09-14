import { z } from "zod";

export const createAnalysisSchema = z.object({
  resumeId: z.string().uuid("Invalid resume ID."),
  careerId: z.string().uuid("Invalid career ID."),
});

export type CreateAnalysisInput = z.infer<
  typeof createAnalysisSchema
>;


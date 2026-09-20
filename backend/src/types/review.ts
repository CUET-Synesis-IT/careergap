export type ReviewTaskStatus = "OPEN" | "LOCKED" | "COMPLETED";

export interface ReviewResult {
  matchPercentage: number;
  matchedSkills: (string | { name: string; importance?: string })[];
  missingSkills: (string | { name: string; importance?: string })[];
}

export interface ReviewTaskResponse {
  id: string;
  status: ReviewTaskStatus;
  analysisId: string;
  lockedById: string | null;
  lockExpiresAt: Date | null;
  completedAt: Date | null;
  analysis: {
    id: string;
    resumeId: string;
    careerId: string;
    extractedSkills?: string[] | null;
    aiResult: ReviewResult | null;
    career: {
      id: string;
      slug: string;
      name: string;
      description: string;
      profile?: unknown;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

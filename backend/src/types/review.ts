export type ReviewTaskStatus = "OPEN" | "LOCKED" | "COMPLETED";

export interface ReviewResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
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
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

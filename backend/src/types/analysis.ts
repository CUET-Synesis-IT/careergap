export type AnalysisStatus =
  | "PENDING"
  | "PROCESSING"
  | "REVIEW"
  | "COMPLETED"
  | "FAILED";

export interface AnalysisResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface AnalysisResponse {
  id: string;
  status: AnalysisStatus;
  resumeId: string;
  careerId: string;
  career?: {
    id: string;
    slug: string;
    name: string;
    description: string;
  };
  aiResult?: AnalysisResult | null;
  finalResult?: AnalysisResult | null;
  createdAt: Date;
  updatedAt: Date;
  error?: {
    code: string;
    message: string;
  } | null;
}

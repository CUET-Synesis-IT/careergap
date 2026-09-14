// Core Enums
export type UserRole = "USER" | "REVIEWER" | "SUPER_ADMIN";

export type AnalysisStatus =
  | "PENDING"
  | "PROCESSING"
  | "REVIEW"
  | "COMPLETED"
  | "FAILED";

export type ReviewTaskStatus = "OPEN" | "LOCKED" | "COMPLETED";

export type SkillImportance = "HIGH" | "MEDIUM" | "LOW";

// Entities
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CareerSkill {
  name: string;
  importance: SkillImportance;
}

export interface CareerProfile {
  skills: CareerSkill[];
}

export interface Career {
  id: string;
  slug: string;
  name: string;
  description: string;
  profile?: CareerProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface Resume {
  id: string;
  fileName: string;
  createdAt: string;
  userId?: string;
  text?: string;
  textHash?: string;
}

export interface AnalysisResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface Analysis {
  id: string;
  status: AnalysisStatus;
  resumeId: string;
  careerId: string;
  career?: Career;
  resume?: Resume;
  extractedSkills?: string[] | null;
  aiMatchPercentage?: number | null;
  aiMatchedSkills?: string[] | null;
  aiMissingSkills?: string[] | null;
  finalMatchPercentage?: number | null;
  finalMatchedSkills?: string[] | null;
  finalMissingSkills?: string[] | null;
  aiResult?: AnalysisResult | null;
  finalResult?: AnalysisResult | null;
  createdAt: string;
  updatedAt?: string;
  error?: {
    code: string;
    message: string;
  } | null;
}

export interface ReviewTask {
  id: string;
  status: ReviewTaskStatus;
  analysisId: string;
  lockedById: string | null;
  lockExpiresAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  analysis: {
    id: string;
    resumeId: string;
    careerId: string;
    aiResult: AnalysisResult | null;
    career: Career;
  };
}

export interface ReviewTaskDetail {
  task: {
    id: string;
    status: ReviewTaskStatus;
    lockedBy?: string | null;
    lockExpiresAt?: string | null;
  };
  resume: {
    id: string;
    fileName: string;
    text: string;
  };
  career: Career;
  analysis: {
    id: string;
    status: AnalysisStatus;
    aiResult: AnalysisResult;
  };
}

export interface Review {
  id: string;
  reviewTaskId: string;
  reviewerId?: string;
  originalMatchPercentage?: number | null;
  originalMatchedSkills?: string[] | null;
  originalMissingSkills?: string[] | null;
  finalMatchPercentage: number;
  finalMatchedSkills: string[];
  finalMissingSkills: string[];
  comment?: string | null;
  createdAt: string;
}

export interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: "REVIEWER";
  isActive: boolean;
  createdAt: string;
}

// Request & Response DTOs

// Auth
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface MeResponse {
  user: User;
}

export interface LogoutResponse {
  message: string;
}

// Resume
export interface UploadResumeResponse {
  resume: Resume;
}

export interface GetResumeResponse {
  resume: Resume;
}

// Career
export interface GetCareersResponse {
  careers: Career[];
}

export interface GetCareerResponse {
  career: Career;
}

// Analysis
export interface CreateAnalysisRequest {
  resumeId: string;
  careerId: string;
}

export interface CreateAnalysisResponse {
  analysis: Analysis;
}

export interface GetAnalysesResponse {
  analyses: Analysis[];
}

export interface GetAnalysisResponse {
  analysis: Analysis;
}

// Review
export interface GetReviewTasksResponse {
  tasks: ReviewTask[];
}

export interface ClaimReviewTaskResponse {
  task: ReviewTask;
}

export type GetReviewTaskDetailResponse = ReviewTaskDetail;

export interface SubmitReviewRequest {
  finalMatchPercentage: number;
  finalMatchedSkills: string[];
  finalMissingSkills: string[];
  comment?: string;
}

export interface SubmitReviewResponse {
  review: {
    id: string;
    reviewTaskId: string;
    createdAt: string;
  };
  analysis: {
    id: string;
    status: AnalysisStatus;
    finalResult: AnalysisResult;
  };
}

// Admin
export interface GetReviewersResponse {
  reviewers: Reviewer[];
}

export interface CreateReviewerRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateReviewerResponse {
  reviewer: Reviewer;
}

export interface UpdateReviewerRequest {
  isActive: boolean;
}

export interface UpdateReviewerResponse {
  reviewer: Reviewer;
}

// Envelope shapes
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  code: string;
}

import { api } from "@/lib/api/client";
import type {
  ClaimReviewTaskResponse,
  GetReviewTaskDetailResponse,
  GetReviewTasksResponse,
  SubmitReviewRequest,
  SubmitReviewResponse,
} from "@/lib/api/types";

export const reviewApi = {
  getTasks: () =>
    api.get<GetReviewTasksResponse>("/reviews/tasks"),

  claimTask: (id: string) =>
    api.post<ClaimReviewTaskResponse>(`/reviews/tasks/${id}/claim`),

  getTask: (id: string) =>
    api.get<GetReviewTaskDetailResponse>(`/reviews/tasks/${id}`),

  submitReview: (id: string, data: SubmitReviewRequest) =>
    api.post<SubmitReviewResponse>(`/reviews/tasks/${id}/submit`, data),
};


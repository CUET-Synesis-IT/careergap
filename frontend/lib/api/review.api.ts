import { api } from "@/lib/api/client";
import type {
  ReviewTask,
  SubmitReviewRequest,
} from "@/lib/api/types";

export const reviewApi = {
  getTasks: () =>
    api.get<ReviewTask[]>("/reviews/tasks"),

  claimTask: (id: string) =>
    api.post<ReviewTask>(`/reviews/tasks/${id}/claim`),

  getTask: (id: string) =>
    api.get<ReviewTask>(`/reviews/tasks/${id}`),

  submitReview: (id: string, data: SubmitReviewRequest) =>
    api.post<void>(`/reviews/tasks/${id}/submit`, data),
};

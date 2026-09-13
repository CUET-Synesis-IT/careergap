import { api } from "@/lib/api/client";
import type {
  CreateReviewerRequest,
  CreateReviewerResponse,
  GetReviewersResponse,
  UpdateReviewerRequest,
  UpdateReviewerResponse,
} from "@/lib/api/types";

export const adminApi = {
  getReviewers: () =>
    api.get<GetReviewersResponse>("/admin/reviewers"),

  createReviewer: (data: CreateReviewerRequest) =>
    api.post<CreateReviewerResponse>("/admin/reviewers", data),

  updateReviewer: (id: string, data: UpdateReviewerRequest) =>
    api.patch<UpdateReviewerResponse>(`/admin/reviewers/${id}`, data),
};


import { api } from "@/lib/api/client";
import type {
  Analysis,
  CreateAnalysisRequest,
} from "@/lib/api/types";

export const analysisApi = {
  create: (data: CreateAnalysisRequest) =>
    api.post<Analysis>("/analyses", data),

  getAll: () =>
    api.get<Analysis[]>("/analyses"),

  getById: (id: string) =>
    api.get<Analysis>(`/analyses/${id}`),
};

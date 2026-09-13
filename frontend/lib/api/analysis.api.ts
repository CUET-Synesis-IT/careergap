import { api } from "@/lib/api/client";
import type {
  CreateAnalysisRequest,
  CreateAnalysisResponse,
  GetAnalysesResponse,
  GetAnalysisResponse,
} from "@/lib/api/types";

export const analysisApi = {
  create: (data: CreateAnalysisRequest) =>
    api.post<CreateAnalysisResponse>("/analyses", data),

  getAll: () =>
    api.get<GetAnalysesResponse>("/analyses"),

  getById: (id: string) =>
    api.get<GetAnalysisResponse>(`/analyses/${id}`),
};


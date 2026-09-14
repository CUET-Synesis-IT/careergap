import { api } from "@/lib/api/client";
import type {
  Analysis,
  CreateAnalysisRequest,
} from "@/lib/api/types";

export const analysisApi = {
  create: async (data: CreateAnalysisRequest): Promise<Analysis> => {
    const res = await api.post<Analysis | { analysis: Analysis }>("/analyses", data);
    if (res && typeof res === "object" && "analysis" in res && res.analysis) {
      return res.analysis;
    }
    return res as Analysis;
  },

  getAll: async (): Promise<Analysis[]> => {
    const res = await api.get<Analysis[] | { analyses: Analysis[] }>("/analyses");
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "analyses" in res && Array.isArray(res.analyses)) {
      return res.analyses;
    }
    return [];
  },

  getById: async (id: string): Promise<Analysis> => {
    const res = await api.get<Analysis | { analysis: Analysis }>(`/analyses/${id}`);
    if (res && typeof res === "object" && "analysis" in res && res.analysis) {
      return res.analysis;
    }
    return res as Analysis;
  },
};

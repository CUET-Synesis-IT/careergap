import { api } from "@/lib/api/client";
import type { GetCareerResponse, GetCareersResponse } from "@/lib/api/types";

export const careerApi = {
  getAll: () =>
    api.get<GetCareersResponse>("/careers"),

  getById: (id: string) =>
    api.get<GetCareerResponse>(`/careers/${id}`),
};


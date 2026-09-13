import { api } from "@/lib/api/client";
import type { GetResumeResponse, UploadResumeResponse } from "@/lib/api/types";

export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<UploadResumeResponse>("/resumes", formData);
  },

  getById: (id: string) =>
    api.get<GetResumeResponse>(`/resumes/${id}`),
};


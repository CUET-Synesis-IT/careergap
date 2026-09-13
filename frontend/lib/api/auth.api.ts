import { api } from "@/lib/api/client";
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/api/types";

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>("/auth/register", data),

  login: (data: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", data),

  me: () =>
    api.get<MeResponse>("/auth/me"),

  logout: () =>
    api.post<LogoutResponse>("/auth/logout"),
};


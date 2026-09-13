import { API_BASE_URL } from "@/lib/config";
import { getStoredToken, removeStoredToken } from "@/lib/api/token";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "UNKNOWN_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

interface ApiResponseEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  code?: string;
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (isFormData) {
    body = options.body as FormData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to connect to CareerGap server. Please check your connection and try again.",
      "NETWORK_ERROR"
    );
  }

  let parsed: ApiResponseEnvelope<T> | null = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      parsed = (await response.json()) as ApiResponseEnvelope<T>;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const message = parsed?.message || response.statusText || "Request failed";
    const code = parsed?.code || `HTTP_${response.status}`;
    throw new ApiError(response.status, message, code);
  }

  if (parsed && typeof parsed === "object" && parsed.success && parsed.data !== undefined) {
    return parsed.data as T;
  }

  return parsed as unknown as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};


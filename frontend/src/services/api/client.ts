import axios, { AxiosError, type AxiosInstance } from "axios";
import { API_URL } from "@/lib/env";
import { getAuthToken } from "@/services/auth/token";
import type { ApiError } from "@/types/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    const normalized: ApiError = {
      message:
        error.response?.data?.message ??
        error.response?.data?.detail ??
        error.message ??
        "Unexpected API error",
      status: error.response?.status,
      code: error.code,
    };
    return Promise.reject(normalized);
  },
);

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as ApiError).message === "string"
  );
}

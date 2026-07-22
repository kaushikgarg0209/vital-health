import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  SessionResponse,
} from "@/types/auth";
import { apiFetch } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = await apiFetch<ApiDataResponse<{ user: AuthUser }>>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data.user;
}

export async function register(input: RegisterInput): Promise<{ userId: string }> {
  const response = await apiFetch<ApiDataResponse<{ userId: string }>>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function logout(): Promise<void> {
  await apiFetch<ApiDataResponse<{ message: string }>>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export async function getSession(): Promise<SessionResponse> {
  const response = await apiFetch<ApiDataResponse<SessionResponse>>(
    "/api/v1/auth/session",
  );

  return response.data;
}

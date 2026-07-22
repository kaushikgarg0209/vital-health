import type { Profile, UpdateProfileInput } from "@/types/profile";
import { ApiError, apiFetch } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

export async function getProfile(): Promise<Profile | null> {
  try {
    const response = await apiFetch<ApiDataResponse<Profile>>("/api/v1/profile");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const response = await apiFetch<ApiDataResponse<{ message: string; profile: Profile }>>(
    "/api/v1/profile",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );

  return response.data.profile;
}

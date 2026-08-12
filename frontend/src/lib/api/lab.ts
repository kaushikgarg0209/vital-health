import type {
  BiomarkerAlert,
  BiomarkerDetail,
  BiomarkerInsight,
  CreateManualReadingInput,
  LabBiomarkersResponse,
  LabReading,
} from "@/types/lab";
import { ApiError, apiFetch } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

export function toUserFacingLabError(
  status: number,
  code?: string,
  message?: string,
): string {
  if (status === 429 || code === "RATE_LIMIT_EXCEEDED") {
    return "The AI is temporarily busy. Please wait a moment and try again.";
  }

  if (status === 404 && code === "BIOMARKER_NOT_FOUND") {
    return "No readings found for this biomarker yet.";
  }

  return message ?? "Something went wrong. Please try again.";
}

export async function listBiomarkers(): Promise<LabBiomarkersResponse> {
  const response = await apiFetch<ApiDataResponse<LabBiomarkersResponse>>(
    "/api/v1/lab/biomarkers",
  );
  return response.data;
}

export async function getBiomarker(biomarkerKey: string): Promise<BiomarkerDetail> {
  const response = await apiFetch<ApiDataResponse<BiomarkerDetail>>(
    `/api/v1/lab/biomarkers/${encodeURIComponent(biomarkerKey)}`,
  );
  return response.data;
}

export async function getBiomarkerInsight(biomarkerKey: string): Promise<BiomarkerInsight> {
  const response = await apiFetch<ApiDataResponse<BiomarkerInsight>>(
    `/api/v1/lab/biomarkers/${encodeURIComponent(biomarkerKey)}/insight`,
  );
  return response.data;
}

export async function createManualReading(
  input: CreateManualReadingInput,
): Promise<LabReading> {
  const response = await apiFetch<ApiDataResponse<LabReading>>("/api/v1/lab/readings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function listLabAlerts(): Promise<BiomarkerAlert[]> {
  const response = await apiFetch<ApiDataResponse<BiomarkerAlert[]>>("/api/v1/lab/alerts");
  return response.data;
}

export async function markLabAlertRead(alertId: string): Promise<BiomarkerAlert> {
  const response = await apiFetch<ApiDataResponse<BiomarkerAlert>>(
    `/api/v1/lab/alerts/${encodeURIComponent(alertId)}/read`,
    { method: "PATCH" },
  );
  return response.data;
}

export function isLabApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

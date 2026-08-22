import type {
  AddWeightMeasurementInput,
  NutritionTargets,
  SubmitCheckinInput,
  UpdateWellnessPreferencesInput,
  WeeklyCheckin,
  WellnessPlan,
  WellnessPreferences,
  WellnessReadiness,
  WeightMeasurement,
} from "@/types/wellness";
import { ApiError, apiFetch } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

export function toUserFacingWellnessError(
  status: number,
  code?: string,
  message?: string,
): string {
  switch (code) {
    case "NOT_READY": {
      if (message?.includes("lab_data_or_general_wellness_goal")) {
        return 'Choose "General wellness" as your goal, or add lab results with markers to track.';
      }

      const profileFields = [
        "date_of_birth",
        "biological_sex",
        "height_cm",
        "weight_kg",
        "wellness_preferences",
      ];
      const missingField = profileFields.find((field) => message?.includes(field));
      if (missingField === "wellness_preferences") {
        return "Complete the wellness setup wizard first.";
      }
      if (missingField) {
        return "Add your age, sex, height, and weight in Settings first.";
      }

      return message ?? "Complete your profile and wellness preferences before generating a plan.";
    }
    case "PROFILE_INCOMPLETE":
      return "Add your age, sex, height, and weight in Settings first.";
    case "PREFERENCES_INCOMPLETE":
      return "Complete the wellness setup wizard first.";
    case "PLAN_NOT_FOUND":
      return "Wellness plan not found.";
    case "CHECKIN_EXISTS":
      return "You already submitted a check-in for this week.";
    case "PLAN_GENERATION_FAILED":
      return "We couldn't generate your plan right now. Please try again in a moment.";
    case "VALIDATION_ERROR":
      return message ?? "Please check your input and try again.";
    default:
      break;
  }

  if (status === 404) {
    return message ?? "The requested resource was not found.";
  }

  return message ?? "Something went wrong. Please try again.";
}

export function isWellnessApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function getWellnessReadiness(): Promise<WellnessReadiness> {
  const response = await apiFetch<ApiDataResponse<WellnessReadiness>>("/api/v1/wellness/readiness");
  return response.data;
}

export async function getWellnessPreferences(): Promise<WellnessPreferences | null> {
  const response = await apiFetch<ApiDataResponse<WellnessPreferences | null>>(
    "/api/v1/wellness/preferences",
  );
  return response.data;
}

export async function updateWellnessPreferences(
  input: UpdateWellnessPreferencesInput,
): Promise<WellnessPreferences> {
  const response = await apiFetch<ApiDataResponse<WellnessPreferences>>(
    "/api/v1/wellness/preferences",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function listWeightMeasurements(): Promise<WeightMeasurement[]> {
  const response = await apiFetch<ApiDataResponse<WeightMeasurement[]>>("/api/v1/wellness/weight");
  return response.data;
}

export async function addWeightMeasurement(
  input: AddWeightMeasurementInput,
): Promise<WeightMeasurement> {
  const response = await apiFetch<ApiDataResponse<WeightMeasurement>>("/api/v1/wellness/weight", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getNutritionTargets(): Promise<NutritionTargets> {
  const response = await apiFetch<ApiDataResponse<NutritionTargets>>("/api/v1/wellness/targets");
  return response.data;
}

export async function generateWellnessPlan(): Promise<WellnessPlan> {
  const response = await apiFetch<ApiDataResponse<WellnessPlan>>("/api/v1/wellness/plans/generate", {
    method: "POST",
  });
  return response.data;
}

export async function getActiveWellnessPlan(): Promise<WellnessPlan | null> {
  const response = await apiFetch<ApiDataResponse<WellnessPlan | null>>(
    "/api/v1/wellness/plans/active",
  );
  return response.data;
}

export async function listPlanCheckins(planId: string): Promise<WeeklyCheckin[]> {
  const response = await apiFetch<ApiDataResponse<WeeklyCheckin[]>>(
    `/api/v1/wellness/plans/${planId}/checkins`,
  );
  return response.data;
}

export async function submitWeeklyCheckin(
  planId: string,
  input: SubmitCheckinInput,
): Promise<{ checkin: WeeklyCheckin; plan: WellnessPlan }> {
  const response = await apiFetch<ApiDataResponse<{ checkin: WeeklyCheckin; plan: WellnessPlan }>>(
    `/api/v1/wellness/plans/${planId}/checkins`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWeightMeasurement,
  generateWellnessPlan,
  getActiveWellnessPlan,
  getNutritionTargets,
  getWellnessPreferences,
  getWellnessReadiness,
  listPlanCheckins,
  listWeightMeasurements,
  submitWeeklyCheckin,
  updateWellnessPreferences,
} from "@/lib/api/wellness";
import type {
  AddWeightMeasurementInput,
  SubmitCheckinInput,
  UpdateWellnessPreferencesInput,
} from "@/types/wellness";

export const wellnessReadinessQueryKey = ["wellness", "readiness"] as const;
export const wellnessPreferencesQueryKey = ["wellness", "preferences"] as const;
export const wellnessWeightQueryKey = ["wellness", "weight"] as const;
export const wellnessTargetsQueryKey = ["wellness", "targets"] as const;
export const wellnessActivePlanQueryKey = ["wellness", "plan", "active"] as const;
export const wellnessCheckinsQueryKey = (planId: string) =>
  ["wellness", "plan", planId, "checkins"] as const;

export function useWellnessReadiness() {
  return useQuery({
    queryKey: wellnessReadinessQueryKey,
    queryFn: getWellnessReadiness,
  });
}

export function useWellnessPreferences() {
  return useQuery({
    queryKey: wellnessPreferencesQueryKey,
    queryFn: getWellnessPreferences,
  });
}

export function useUpdateWellnessPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWellnessPreferencesInput) => updateWellnessPreferences(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wellnessPreferencesQueryKey });
      void queryClient.invalidateQueries({ queryKey: wellnessReadinessQueryKey });
      void queryClient.invalidateQueries({ queryKey: wellnessTargetsQueryKey });
    },
  });
}

export function useWeightMeasurements() {
  return useQuery({
    queryKey: wellnessWeightQueryKey,
    queryFn: listWeightMeasurements,
  });
}

export function useAddWeightMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddWeightMeasurementInput) => addWeightMeasurement(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wellnessWeightQueryKey });
      void queryClient.invalidateQueries({ queryKey: wellnessTargetsQueryKey });
      void queryClient.invalidateQueries({ queryKey: wellnessReadinessQueryKey });
    },
  });
}

export function useNutritionTargets(enabled = true) {
  return useQuery({
    queryKey: wellnessTargetsQueryKey,
    queryFn: getNutritionTargets,
    enabled,
  });
}

export function useActiveWellnessPlan() {
  return useQuery({
    queryKey: wellnessActivePlanQueryKey,
    queryFn: getActiveWellnessPlan,
  });
}

export function useGenerateWellnessPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateWellnessPlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wellnessActivePlanQueryKey });
    },
  });
}

export function usePlanCheckins(planId: string) {
  return useQuery({
    queryKey: wellnessCheckinsQueryKey(planId),
    queryFn: () => listPlanCheckins(planId),
    enabled: planId.length > 0,
  });
}

export function useSubmitWeeklyCheckin(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitCheckinInput) => submitWeeklyCheckin(planId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wellnessCheckinsQueryKey(planId) });
      void queryClient.invalidateQueries({ queryKey: wellnessActivePlanQueryKey });
      void queryClient.invalidateQueries({ queryKey: wellnessWeightQueryKey });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManualReading,
  getBiomarker,
  getBiomarkerInsight,
  listBiomarkers,
  listLabAlerts,
  markLabAlertRead,
} from "@/lib/api/lab";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import type { CreateManualReadingInput } from "@/types/lab";

export const labBiomarkersQueryKey = ["lab", "biomarkers"] as const;
export const labBiomarkerQueryKey = (key: string) => ["lab", "biomarker", key] as const;
export const labInsightQueryKey = (key: string) => ["lab", "insight", key] as const;
export const labAlertsQueryKey = ["lab", "alerts"] as const;

export function useLabBiomarkers() {
  return useQuery({
    queryKey: labBiomarkersQueryKey,
    queryFn: listBiomarkers,
  });
}

export function useBiomarkerDetail(biomarkerKey: string) {
  return useQuery({
    queryKey: labBiomarkerQueryKey(biomarkerKey),
    queryFn: () => getBiomarker(biomarkerKey),
    enabled: biomarkerKey.length > 0,
  });
}

export function useBiomarkerInsight(biomarkerKey: string, enabled = true) {
  return useQuery({
    queryKey: labInsightQueryKey(biomarkerKey),
    queryFn: () => getBiomarkerInsight(biomarkerKey),
    enabled: enabled && biomarkerKey.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && "status" in error && (error as { status: number }).status === 429) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export function useLabAlerts() {
  return useQuery({
    queryKey: labAlertsQueryKey,
    queryFn: listLabAlerts,
    refetchInterval: 60_000,
  });
}

export function useCreateManualReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateManualReadingInput) => createManualReading(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: labBiomarkersQueryKey });
      void queryClient.invalidateQueries({
        queryKey: labBiomarkerQueryKey(variables.biomarkerKey),
      });
      void queryClient.invalidateQueries({
        queryKey: labInsightQueryKey(variables.biomarkerKey),
      });
      void queryClient.invalidateQueries({ queryKey: labAlertsQueryKey });
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useMutation({
    mutationFn: (alertId: string) => markLabAlertRead(alertId),
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: labAlertsQueryKey });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof listLabAlerts>>>(
        labAlertsQueryKey,
      );
      if (previous) {
        const next = previous.filter((alert) => alert.id !== alertId);
        queryClient.setQueryData(labAlertsQueryKey, next);
        setUnreadCount(next.length);
      }
      return { previous };
    },
    onError: (_error, _alertId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(labAlertsQueryKey, context.previous);
        setUnreadCount(context.previous.length);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: labAlertsQueryKey });
    },
  });
}

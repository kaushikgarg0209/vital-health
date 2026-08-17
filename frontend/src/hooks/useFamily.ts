"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvitation,
  createGroup,
  createInvitation,
  declineInvitation,
  deleteGroup,
  getCaregiverSummary,
  getEmergencyBrief,
  getGroup,
  listFamilyNotifications,
  listGroups,
  markFamilyNotificationRead,
  revokeMembership,
} from "@/lib/api/family";
import type {
  CreateGroupInput,
  CreateInvitationInput,
  InvitationTokenInput,
} from "@/types/family";

export const familyGroupsQueryKey = ["family", "groups"] as const;
export const familyGroupQueryKey = (groupId: string) => ["family", "group", groupId] as const;
export const caregiverSummaryQueryKey = (groupId: string, userId: string) =>
  ["family", "summary", groupId, userId] as const;
export const emergencyBriefQueryKey = (groupId: string, userId: string) =>
  ["family", "emergency-brief", groupId, userId] as const;
export const familyNotificationsQueryKey = ["family", "notifications"] as const;

export function useFamilyGroups() {
  return useQuery({
    queryKey: familyGroupsQueryKey,
    queryFn: listGroups,
  });
}

export function useFamilyGroup(groupId: string) {
  return useQuery({
    queryKey: familyGroupQueryKey(groupId),
    queryFn: () => getGroup(groupId),
    enabled: groupId.length > 0,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyGroupsQueryKey });
    },
  });
}

export function useCreateInvitation(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvitationInput) => createInvitation(groupId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyGroupQueryKey(groupId) });
      void queryClient.invalidateQueries({ queryKey: familyGroupsQueryKey });
    },
  });
}

export function useRevokeMembership(groupId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) => revokeMembership(membershipId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyGroupsQueryKey });
      if (groupId) {
        void queryClient.invalidateQueries({ queryKey: familyGroupQueryKey(groupId) });
      }
      void queryClient.invalidateQueries({ queryKey: familyNotificationsQueryKey });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => deleteGroup(groupId),
    onSuccess: (_data, groupId) => {
      void queryClient.invalidateQueries({ queryKey: familyGroupsQueryKey });
      void queryClient.removeQueries({ queryKey: familyGroupQueryKey(groupId) });
      void queryClient.invalidateQueries({ queryKey: familyNotificationsQueryKey });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InvitationTokenInput) => acceptInvitation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyGroupsQueryKey });
      void queryClient.invalidateQueries({ queryKey: familyNotificationsQueryKey });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InvitationTokenInput) => declineInvitation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: familyNotificationsQueryKey });
    },
  });
}

export function useCaregiverSummary(groupId: string, userId: string, enabled = true) {
  return useQuery({
    queryKey: caregiverSummaryQueryKey(groupId, userId),
    queryFn: () => getCaregiverSummary(groupId, userId),
    enabled: enabled && groupId.length > 0 && userId.length > 0,
  });
}

export function useEmergencyBrief(groupId: string, userId: string, enabled = true) {
  return useQuery({
    queryKey: emergencyBriefQueryKey(groupId, userId),
    queryFn: () => getEmergencyBrief(groupId, userId),
    enabled: enabled && groupId.length > 0 && userId.length > 0,
  });
}

export function useFamilyNotifications() {
  return useQuery({
    queryKey: familyNotificationsQueryKey,
    queryFn: listFamilyNotifications,
    refetchInterval: 60_000,
  });
}

export function useMarkFamilyNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markFamilyNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: familyNotificationsQueryKey });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof listFamilyNotifications>>>(
        familyNotificationsQueryKey,
      );
      if (previous) {
        queryClient.setQueryData(
          familyNotificationsQueryKey,
          previous.filter((notification) => notification.id !== notificationId),
        );
      }
      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(familyNotificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: familyNotificationsQueryKey });
    },
  });
}

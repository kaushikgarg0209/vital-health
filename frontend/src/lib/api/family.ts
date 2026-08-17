import type {
  AcceptInvitationResult,
  CaregiverSummary,
  CreateGroupInput,
  CreateInvitationInput,
  CreateInvitationResult,
  EmergencyBrief,
  FamilyGroupDetail,
  FamilyGroupSummary,
  FamilyNotification,
  InvitationTokenInput,
} from "@/types/family";
import { ApiError, apiFetch } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

export function toUserFacingFamilyError(
  status: number,
  code?: string,
  message?: string,
): string {
  switch (code) {
    case "INVITATION_EXPIRED":
      return "This invitation has expired. Ask the person who invited you to send a new one.";
    case "INVITATION_NOT_FOUND":
      return "This invitation link is invalid or no longer exists.";
    case "INVITATION_INVALID":
      return "This invitation has already been accepted, declined, or revoked.";
    case "FORBIDDEN":
      return "This invitation was sent to a different email address. Sign in with the invited account.";
    case "DUPLICATE_INVITE":
      return "An invitation or membership already exists for this person.";
    case "GROUP_NOT_FOUND":
      return "Family group not found or you do not have access.";
    case "MEMBERSHIP_NOT_FOUND":
      return "Membership not found.";
    case "INSUFFICIENT_PERMISSION":
      return "You do not have permission to view this information.";
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

export async function listGroups(): Promise<FamilyGroupSummary[]> {
  const response = await apiFetch<ApiDataResponse<FamilyGroupSummary[]>>("/api/v1/family/groups");
  return response.data;
}

export async function createGroup(input: CreateGroupInput): Promise<FamilyGroupSummary> {
  const response = await apiFetch<ApiDataResponse<FamilyGroupSummary>>("/api/v1/family/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getGroup(groupId: string): Promise<FamilyGroupDetail> {
  const response = await apiFetch<ApiDataResponse<FamilyGroupDetail>>(
    `/api/v1/family/groups/${encodeURIComponent(groupId)}`,
  );
  return response.data;
}

export async function deleteGroup(groupId: string): Promise<{ deleted: true }> {
  const response = await apiFetch<ApiDataResponse<{ deleted: true }>>(
    `/api/v1/family/groups/${encodeURIComponent(groupId)}`,
    { method: "DELETE" },
  );
  return response.data;
}

export async function createInvitation(
  groupId: string,
  input: CreateInvitationInput,
): Promise<CreateInvitationResult> {
  const response = await apiFetch<ApiDataResponse<CreateInvitationResult>>(
    `/api/v1/family/groups/${encodeURIComponent(groupId)}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function acceptInvitation(
  input: InvitationTokenInput,
): Promise<AcceptInvitationResult> {
  const response = await apiFetch<ApiDataResponse<AcceptInvitationResult>>(
    "/api/v1/family/invitations/accept",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function declineInvitation(input: InvitationTokenInput): Promise<{ accepted: false }> {
  const response = await apiFetch<ApiDataResponse<{ accepted: false }>>(
    "/api/v1/family/invitations/decline",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function revokeMembership(membershipId: string): Promise<{ revoked: true }> {
  const response = await apiFetch<ApiDataResponse<{ revoked: true }>>(
    `/api/v1/family/memberships/${encodeURIComponent(membershipId)}`,
    { method: "DELETE" },
  );
  return response.data;
}

export async function getCaregiverSummary(
  groupId: string,
  userId: string,
): Promise<CaregiverSummary> {
  const response = await apiFetch<ApiDataResponse<CaregiverSummary>>(
    `/api/v1/family/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/summary`,
  );
  return response.data;
}

export async function getEmergencyBrief(
  groupId: string,
  userId: string,
): Promise<EmergencyBrief> {
  const response = await apiFetch<ApiDataResponse<EmergencyBrief>>(
    `/api/v1/family/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/emergency-brief`,
  );
  return response.data;
}

export async function listFamilyNotifications(): Promise<FamilyNotification[]> {
  const response = await apiFetch<ApiDataResponse<FamilyNotification[]>>(
    "/api/v1/family/notifications",
  );
  return response.data;
}

export async function markFamilyNotificationRead(
  notificationId: string,
): Promise<{ read: true }> {
  const response = await apiFetch<ApiDataResponse<{ read: true }>>(
    `/api/v1/family/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
  return response.data;
}

export function isFamilyApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

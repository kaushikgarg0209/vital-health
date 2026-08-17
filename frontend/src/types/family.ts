import type { NotificationType } from "@/lib/tokens";
import type { BiomarkerAlert, LabBiomarkersResponse } from "@/types/lab";

export type PermissionLevel = "full" | "monitor" | "emergency";

export type MembershipStatus = "pending" | "accepted" | "declined" | "revoked";

export type FamilyGroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
};

/** @deprecated Use FamilyGroupSummary */
export type FamilyGroup = FamilyGroupSummary;

export type FamilyMembershipDetail = {
  id: string;
  subjectUserId: string;
  subjectName: string;
  viewerUserId: string | null;
  viewerName: string | null;
  inviteeEmail: string | null;
  permissionLevel: PermissionLevel;
  status: MembershipStatus;
  acceptedAt: string | null;
  createdAt: string;
  invitationToken?: string | null;
};

export type FamilyGroupDetail = {
  id: string;
  name: string;
  createdBy: string;
  memberships: FamilyMembershipDetail[];
  createdAt: string;
};

export type CreateGroupInput = {
  name: string;
};

export type CreateInvitationInput = {
  email: string;
  permissionLevel: PermissionLevel;
};

export type InvitationTokenInput = {
  token: string;
};

export type AcceptInvitationResult = {
  groupId: string;
  membershipId: string;
};

export type CreateInvitationResult = {
  membershipId: string;
  token: string;
  expiresAt: string;
};

export type FamilyNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};

export type CaregiverSummary = {
  subjectUserId: string;
  permissionLevel: PermissionLevel;
  biomarkers: LabBiomarkersResponse;
  alerts: BiomarkerAlert[];
  activePrescriptions: Array<{
    medicationName: string;
    dosage: string | null;
    frequency: string | null;
  }>;
  currentMedications: string[];
  lastDocumentDate: string | null;
};

export type EmergencyBrief = {
  fullName: string;
  dateOfBirth: string | null;
  biologicalSex: string | null;
  bloodType: string | null;
  heightCm: number | null;
  weightKg: number | null;
  knownConditions: string[];
  allergies: string[];
  currentMedications: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  primaryCareDoctor: string | null;
  activePrescriptions: Array<{
    medicationName: string;
    dosage: string | null;
    frequency: string | null;
    prescribingDoctor: string | null;
  }>;
};

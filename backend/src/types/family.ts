export type PermissionLevel = "full" | "monitor" | "emergency";

export type MembershipStatus = "pending" | "accepted" | "declined" | "revoked";

export type NotificationType =
  | "biomarker_alert"
  | "family_alert"
  | "family_invitation"
  | "document_processed"
  | "document_failed";

export type FamilyGroupRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type FamilyMembershipRow = {
  id: string;
  group_id: string;
  subject_user_id: string;
  viewer_user_id: string | null;
  invitee_email: string | null;
  permission_level: PermissionLevel;
  status: MembershipStatus;
  invitation_token: string | null;
  invitation_expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type FamilyGroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
};

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
};

export type FamilyGroupDetail = {
  id: string;
  name: string;
  createdBy: string;
  memberships: FamilyMembershipDetail[];
  createdAt: string;
};

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};

export const PERMISSION_RANK: Record<PermissionLevel, number> = {
  emergency: 1,
  monitor: 2,
  full: 3,
};

export function hasMinimumPermission(
  granted: PermissionLevel,
  required: PermissionLevel,
): boolean {
  return PERMISSION_RANK[granted] >= PERMISSION_RANK[required];
}

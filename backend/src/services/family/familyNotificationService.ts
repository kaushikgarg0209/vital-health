import { supabaseAdmin } from "../../config/supabase.js";
import type { NotificationRow } from "../../types/family.js";
import { getFamilyAccess } from "./familyAccessService.js";

export type RevokedMembershipNotificationParams = {
  viewerUserId: string | null;
  subjectUserId: string;
  groupId: string;
  membershipId: string;
};

export async function deleteStaleFamilyNotificationsForMembership(
  params: RevokedMembershipNotificationParams,
): Promise<void> {
  const { viewerUserId, subjectUserId, groupId, membershipId } = params;

  if (!viewerUserId) {
    return;
  }

  const { data: alertRows, error: alertLoadError } = await supabaseAdmin
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", viewerUserId)
    .eq("type", "family_alert");

  if (alertLoadError) {
    throw new Error(`Failed to load family alerts for cleanup: ${alertLoadError.message}`);
  }

  const alertIdsToDelete = (alertRows ?? [])
    .filter((row) => {
      const metadata = row.metadata as Record<string, unknown>;
      return metadata.groupId === groupId && metadata.subjectUserId === subjectUserId;
    })
    .map((row) => row.id as string);

  if (alertIdsToDelete.length > 0) {
    const { error: alertError } = await supabaseAdmin
      .from("notifications")
      .delete()
      .in("id", alertIdsToDelete);

    if (alertError) {
      throw new Error(`Failed to delete stale family alerts: ${alertError.message}`);
    }
  }

  const { data: inviteRows, error: inviteLoadError } = await supabaseAdmin
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", viewerUserId)
    .eq("type", "family_invitation");

  if (inviteLoadError) {
    throw new Error(`Failed to load family invitations for cleanup: ${inviteLoadError.message}`);
  }

  const inviteIdsToDelete = (inviteRows ?? [])
    .filter((row) => (row.metadata as Record<string, unknown>)?.membershipId === membershipId)
    .map((row) => row.id as string);

  if (inviteIdsToDelete.length > 0) {
    const { error: inviteError } = await supabaseAdmin
      .from("notifications")
      .delete()
      .in("id", inviteIdsToDelete);

    if (inviteError) {
      throw new Error(`Failed to delete stale family invitations: ${inviteError.message}`);
    }
  }
}

export async function isFamilyNotificationActive(
  userId: string,
  notification: NotificationRow,
): Promise<boolean> {
  if (notification.type === "family_alert") {
    const metadata = notification.metadata ?? {};
    const groupId = metadata.groupId;
    const subjectUserId = metadata.subjectUserId;

    if (typeof groupId !== "string" || typeof subjectUserId !== "string") {
      return false;
    }

    const access = await getFamilyAccess(groupId, subjectUserId, userId);

    if (!access) {
      return false;
    }

    return access.permissionLevel === "monitor" || access.permissionLevel === "full";
  }

  if (notification.type === "family_invitation") {
    const membershipId = notification.metadata?.membershipId;

    if (typeof membershipId !== "string") {
      return false;
    }

    const { data, error } = await supabaseAdmin
      .from("family_memberships")
      .select("status, viewer_user_id")
      .eq("id", membershipId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    if (data.status !== "pending") {
      return false;
    }

    return data.viewer_user_id === null || data.viewer_user_id === userId;
  }

  return true;
}

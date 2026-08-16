import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { supabaseAdmin } from "../../config/supabase.js";
import type { FamilyMembershipRow, PermissionLevel } from "../../types/family.js";
import { createNotification } from "../notificationService.js";
import { FamilyError, userCanAccessGroup } from "./familyService.js";

const INVITATION_TTL_HOURS = 72;

export type CreateInvitationParams = {
  groupId: string;
  subjectUserId: string;
  inviteeEmail: string;
  permissionLevel: PermissionLevel;
};

function sendInvitationEmail(params: {
  inviteeEmail: string;
  subjectName: string;
  token: string;
  permissionLevel: PermissionLevel;
}): void {
  const acceptUrl = `${env.FRONTEND_URL}/family/accept?token=${params.token}`;

  console.log(
    `[family-invite] To: ${params.inviteeEmail} | ${params.subjectName} invited you (${params.permissionLevel})\n` +
      `  Accept: ${acceptUrl}`,
  );
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
    p_email: email,
  });

  if (error) {
    if (error.message.includes("get_user_id_by_email")) {
      return null;
    }

    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data as string | null) ?? null;
}

export async function createInvitation(params: CreateInvitationParams): Promise<{
  membershipId: string;
  token: string;
  expiresAt: string;
}> {
  const { groupId, subjectUserId, inviteeEmail, permissionLevel } = params;
  const normalizedEmail = inviteeEmail.trim().toLowerCase();

  const canAccess = await userCanAccessGroup(groupId, subjectUserId);

  if (!canAccess) {
    throw new FamilyError("Group not found or access denied", 404, "GROUP_NOT_FOUND");
  }

  const matchedUserId = await findUserIdByEmail(normalizedEmail);

  if (matchedUserId === subjectUserId) {
    throw new FamilyError("You cannot invite yourself", 400, "VALIDATION_ERROR");
  }

  const { data: duplicate } = await supabaseAdmin
    .from("family_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("subject_user_id", subjectUserId)
    .in("status", ["pending", "accepted"])
    .ilike("invitee_email", normalizedEmail)
    .limit(1);

  if (duplicate && duplicate.length > 0) {
    throw new FamilyError(
      "An invitation or membership already exists for this person",
      409,
      "DUPLICATE_INVITE",
    );
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: membership, error } = await supabaseAdmin
    .from("family_memberships")
    .insert({
      group_id: groupId,
      subject_user_id: subjectUserId,
      viewer_user_id: matchedUserId,
      invitee_email: normalizedEmail,
      permission_level: permissionLevel,
      status: "pending",
      invitation_token: token,
      invitation_expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !membership) {
    throw new FamilyError(error?.message ?? "Failed to create invitation", 500, "INTERNAL_ERROR");
  }

  const { data: subjectProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", subjectUserId)
    .single();

  sendInvitationEmail({
    inviteeEmail: normalizedEmail,
    subjectName: (subjectProfile?.full_name as string) ?? "A family member",
    token,
    permissionLevel,
  });

  if (matchedUserId) {
    await createNotification({
      userId: matchedUserId,
      type: "family_invitation",
      title: "Family health invitation",
      body: `${subjectProfile?.full_name ?? "Someone"} invited you to their family health group`,
      metadata: { groupId, membershipId: membership.id, token, permissionLevel },
    });
  }

  return {
    membershipId: membership.id as string,
    token,
    expiresAt,
  };
}

async function loadInvitationByToken(token: string): Promise<FamilyMembershipRow> {
  const { data, error } = await supabaseAdmin
    .from("family_memberships")
    .select("*")
    .eq("invitation_token", token)
    .maybeSingle();

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    throw new FamilyError("Invitation not found", 404, "INVITATION_NOT_FOUND");
  }

  return data as FamilyMembershipRow;
}

function assertInvitationValid(row: FamilyMembershipRow): void {
  if (row.status !== "pending") {
    throw new FamilyError("Invitation is no longer pending", 400, "INVITATION_INVALID");
  }

  if (row.invitation_expires_at && new Date(row.invitation_expires_at) < new Date()) {
    throw new FamilyError("Invitation has expired", 410, "INVITATION_EXPIRED");
  }
}

export async function acceptInvitation(
  token: string,
  acceptingUserId: string,
): Promise<{ groupId: string; membershipId: string }> {
  const row = await loadInvitationByToken(token);
  assertInvitationValid(row);

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(acceptingUserId);

  if (!authUser.user) {
    throw new FamilyError("User not found", 404, "USER_NOT_FOUND");
  }

  const userEmail = authUser.user.email?.toLowerCase();

  if (row.invitee_email && userEmail && row.invitee_email.toLowerCase() !== userEmail) {
    throw new FamilyError("This invitation was sent to a different email address", 403, "FORBIDDEN");
  }

  if (row.subject_user_id === acceptingUserId) {
    throw new FamilyError("You cannot accept an invitation to view your own data", 400, "VALIDATION_ERROR");
  }

  const { data: updated, error } = await supabaseAdmin
    .from("family_memberships")
    .update({
      viewer_user_id: acceptingUserId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      invitation_token: null,
    })
    .eq("id", row.id)
    .select("group_id, id")
    .single();

  if (error || !updated) {
    throw new FamilyError(error?.message ?? "Failed to accept invitation", 500, "INTERNAL_ERROR");
  }

  return {
    groupId: updated.group_id as string,
    membershipId: updated.id as string,
  };
}

export async function declineInvitation(token: string, userId: string): Promise<void> {
  const row = await loadInvitationByToken(token);
  assertInvitationValid(row);

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

  const userEmail = authUser.user?.email?.toLowerCase();
  const isInvitee =
    row.viewer_user_id === userId ||
    (row.invitee_email && userEmail && row.invitee_email.toLowerCase() === userEmail);

  if (!isInvitee) {
    throw new FamilyError("Not authorized to decline this invitation", 403, "FORBIDDEN");
  }

  const { error } = await supabaseAdmin
    .from("family_memberships")
    .update({ status: "declined", invitation_token: null })
    .eq("id", row.id);

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }
}

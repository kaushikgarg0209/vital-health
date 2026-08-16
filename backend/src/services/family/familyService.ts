import { supabaseAdmin } from "../../config/supabase.js";
import type {
  FamilyGroupDetail,
  FamilyGroupRow,
  FamilyGroupSummary,
  FamilyMembershipDetail,
  FamilyMembershipRow,
} from "../../types/family.js";
import { deleteStaleFamilyNotificationsForMembership } from "./familyNotificationService.js";

export class FamilyError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "FamilyError";
  }
}

async function fetchProfileNames(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(userIds)];
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueIds);

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  return new Map((data ?? []).map((row) => [row.id as string, row.full_name as string]));
}

function mapMembershipDetail(
  row: FamilyMembershipRow,
  names: Map<string, string>,
): FamilyMembershipDetail {
  return {
    id: row.id,
    subjectUserId: row.subject_user_id,
    subjectName: names.get(row.subject_user_id) ?? "Unknown",
    viewerUserId: row.viewer_user_id,
    viewerName: row.viewer_user_id ? (names.get(row.viewer_user_id) ?? "Unknown") : null,
    inviteeEmail: row.invitee_email,
    permissionLevel: row.permission_level,
    status: row.status,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export async function createGroup(userId: string, name: string): Promise<FamilyGroupSummary> {
  const { data: group, error: groupError } = await supabaseAdmin
    .from("family_groups")
    .insert({ name: name.trim(), created_by: userId })
    .select("*")
    .single();

  if (groupError || !group) {
    throw new FamilyError(groupError?.message ?? "Failed to create group", 500, "INTERNAL_ERROR");
  }

  const groupRow = group as FamilyGroupRow;

  return {
    id: groupRow.id,
    name: groupRow.name,
    memberCount: 0,
    createdAt: groupRow.created_at,
  };
}

export async function listGroupsForUser(userId: string): Promise<FamilyGroupSummary[]> {
  const { data: createdGroups, error: createdError } = await supabaseAdmin
    .from("family_groups")
    .select("id")
    .eq("created_by", userId);

  if (createdError) {
    throw new FamilyError(createdError.message, 500, "INTERNAL_ERROR");
  }

  const { data: memberships, error } = await supabaseAdmin
    .from("family_memberships")
    .select("group_id, status")
    .or(`subject_user_id.eq.${userId},viewer_user_id.eq.${userId}`)
    .in("status", ["pending", "accepted"]);

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  const groupIds = [
    ...new Set([
      ...(createdGroups ?? []).map((row) => row.id as string),
      ...(memberships ?? []).map((row) => row.group_id as string),
    ]),
  ];

  if (groupIds.length === 0) {
    return [];
  }

  const { data: groups, error: groupsError } = await supabaseAdmin
    .from("family_groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsError) {
    throw new FamilyError(groupsError.message, 500, "INTERNAL_ERROR");
  }

  const { data: memberCounts, error: countError } = await supabaseAdmin
    .from("family_memberships")
    .select("group_id")
    .in("group_id", groupIds)
    .eq("status", "accepted");

  if (countError) {
    throw new FamilyError(countError.message, 500, "INTERNAL_ERROR");
  }

  const countMap = new Map<string, number>();
  for (const row of memberCounts ?? []) {
    const groupId = row.group_id as string;
    countMap.set(groupId, (countMap.get(groupId) ?? 0) + 1);
  }

  return (groups ?? []).map((group) => {
    const row = group as FamilyGroupRow;
    return {
      id: row.id,
      name: row.name,
      memberCount: countMap.get(row.id) ?? 0,
      createdAt: row.created_at,
    };
  });
}

export async function userCanAccessGroup(groupId: string, userId: string): Promise<boolean> {
  const { data: group, error: groupError } = await supabaseAdmin
    .from("family_groups")
    .select("created_by")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) {
    throw new FamilyError(groupError.message, 500, "INTERNAL_ERROR");
  }

  if (!group) {
    return false;
  }

  if (group.created_by === userId) {
    return true;
  }

  const { data: membership, error } = await supabaseAdmin
    .from("family_memberships")
    .select("id")
    .eq("group_id", groupId)
    .or(`subject_user_id.eq.${userId},viewer_user_id.eq.${userId}`)
    .in("status", ["pending", "accepted"])
    .limit(1);

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  return (membership ?? []).length > 0;
}

export async function getGroupDetail(groupId: string, userId: string): Promise<FamilyGroupDetail> {
  const canAccess = await userCanAccessGroup(groupId, userId);

  if (!canAccess) {
    throw new FamilyError("Group not found or access denied", 404, "GROUP_NOT_FOUND");
  }

  const { data: group, error: groupError } = await supabaseAdmin
    .from("family_groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new FamilyError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  const groupRow = group as FamilyGroupRow;

  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from("family_memberships")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw new FamilyError(membershipsError.message, 500, "INTERNAL_ERROR");
  }

  const rows = (memberships ?? []) as FamilyMembershipRow[];
  const userIds = rows.flatMap((row) =>
    [row.subject_user_id, row.viewer_user_id].filter((id): id is string => id !== null),
  );
  const names = await fetchProfileNames(userIds);

  return {
    id: groupRow.id,
    name: groupRow.name,
    createdBy: groupRow.created_by,
    memberships: rows.map((row) => mapMembershipDetail(row, names)),
    createdAt: groupRow.created_at,
  };
}

export async function revokeMembership(
  membershipId: string,
  requesterId: string,
): Promise<void> {
  const { data: membership, error } = await supabaseAdmin
    .from("family_memberships")
    .select("*, family_groups!inner(created_by)")
    .eq("id", membershipId)
    .maybeSingle();

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!membership) {
    throw new FamilyError("Membership not found", 404, "MEMBERSHIP_NOT_FOUND");
  }

  const row = membership as FamilyMembershipRow & {
    family_groups: { created_by: string };
  };

  const isSubject = row.subject_user_id === requesterId;
  const isCreator = row.family_groups.created_by === requesterId;

  if (!isSubject && !isCreator) {
    throw new FamilyError("Not authorized to revoke this membership", 403, "FORBIDDEN");
  }

  const { error: updateError } = await supabaseAdmin
    .from("family_memberships")
    .update({ status: "revoked" })
    .eq("id", membershipId);

  if (updateError) {
    throw new FamilyError(updateError.message, 500, "INTERNAL_ERROR");
  }

  await deleteStaleFamilyNotificationsForMembership({
    viewerUserId: row.viewer_user_id,
    subjectUserId: row.subject_user_id,
    groupId: row.group_id,
    membershipId: row.id,
  });
}

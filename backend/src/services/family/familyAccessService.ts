import { supabaseAdmin } from "../../config/supabase.js";
import type { PermissionLevel } from "../../types/family.js";
import { hasMinimumPermission } from "../../types/family.js";
import { FamilyError } from "./familyService.js";

export type FamilyAccessResult = {
  permissionLevel: PermissionLevel;
  membershipId: string;
};

export async function getFamilyAccess(
  groupId: string,
  subjectUserId: string,
  viewerUserId: string,
): Promise<FamilyAccessResult | null> {
  if (subjectUserId === viewerUserId) {
    return { permissionLevel: "full", membershipId: "self" };
  }

  const { data, error } = await supabaseAdmin
    .from("family_memberships")
    .select("id, permission_level")
    .eq("group_id", groupId)
    .eq("subject_user_id", subjectUserId)
    .eq("viewer_user_id", viewerUserId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    return null;
  }

  return {
    permissionLevel: data.permission_level as PermissionLevel,
    membershipId: data.id as string,
  };
}

export async function requireFamilyAccessLevel(
  groupId: string,
  subjectUserId: string,
  viewerUserId: string,
  minLevel: PermissionLevel,
): Promise<FamilyAccessResult> {
  const access = await getFamilyAccess(groupId, subjectUserId, viewerUserId);

  if (!access) {
    throw new FamilyError("You do not have access to this member's health data", 403, "FORBIDDEN");
  }

  if (!hasMinimumPermission(access.permissionLevel, minLevel)) {
    throw new FamilyError(
      `This action requires ${minLevel} access or higher`,
      403,
      "INSUFFICIENT_PERMISSION",
    );
  }

  return access;
}

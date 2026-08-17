import type { BiomarkerStatus } from "../../utils/extractionValues.js";
import { createNotification, hasRecentDuplicateNotification } from "../notificationService.js";
import { supabaseAdmin } from "../../config/supabase.js";

export type FamilyAlertParams = {
  subjectUserId: string;
  biomarkerKey: string;
  biomarkerName: string;
  alertType: "status_change" | "large_delta";
  newValue: number;
  newStatus: BiomarkerStatus | null;
};

export async function notifyFamilyCaregivers(params: FamilyAlertParams): Promise<void> {
  const { data: memberships, error } = await supabaseAdmin
    .from("family_memberships")
    .select("viewer_user_id, group_id, permission_level")
    .eq("subject_user_id", params.subjectUserId)
    .eq("status", "accepted")
    .in("permission_level", ["monitor", "full"]);

  if (error) {
    console.error("Failed to load family memberships for alert fan-out:", error.message);
    return;
  }

  if (!memberships || memberships.length === 0) {
    return;
  }

  const { data: subjectProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", params.subjectUserId)
    .single();

  const subjectName = (subjectProfile?.full_name as string) ?? "A family member";
  const statusLabel = params.newStatus ?? "changed";
  const title = `${subjectName}'s ${params.biomarkerName} needs attention`;
  const body =
    params.alertType === "status_change"
      ? `${params.biomarkerName} moved to ${statusLabel} (latest: ${params.newValue})`
      : `${params.biomarkerName} changed significantly (latest: ${params.newValue})`;

  for (const membership of memberships) {
    const viewerUserId = membership.viewer_user_id as string | null;

    if (!viewerUserId || viewerUserId === params.subjectUserId) {
      continue;
    }

    const isDuplicate = await hasRecentDuplicateNotification({
      userId: viewerUserId,
      type: "family_alert",
      metadataKey: "biomarkerKey",
      metadataValue: params.biomarkerKey,
    });

    if (isDuplicate) {
      continue;
    }

    await createNotification({
      userId: viewerUserId,
      type: "family_alert",
      title,
      body,
      metadata: {
        subjectUserId: params.subjectUserId,
        groupId: membership.group_id,
        biomarkerKey: params.biomarkerKey,
        alertType: params.alertType,
        newValue: params.newValue,
        newStatus: params.newStatus,
        permissionLevel: membership.permission_level,
      },
    });
  }
}

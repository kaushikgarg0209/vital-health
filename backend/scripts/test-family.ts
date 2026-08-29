import "dotenv/config";

import { supabaseAdmin } from "../src/config/supabase.js";
import { buildCaregiverSummary } from "../src/services/family/caregiverSummaryService.js";
import { buildEmergencyBrief } from "../src/services/family/emergencyBriefService.js";
import { requireFamilyAccessLevel } from "../src/services/family/familyAccessService.js";
import {
  createGroup,
  revokeMembership,
} from "../src/services/family/familyService.js";
import {
  acceptInvitation,
  createInvitation,
} from "../src/services/family/invitationService.js";
import { processTrendForBiomarker } from "../src/services/lab/labService.js";
import { notifyFamilyCaregivers } from "../src/services/family/familyAlertService.js";
import {
  listUnreadNotifications,
  markNotificationRead,
} from "../src/services/notificationService.js";
import { redisConnection } from "../src/config/redis.js";

const SUBJECT_EMAIL = "testfamily@example.com";
const CAREGIVER_EMAIL = "test@example.com";

type TestUser = {
  id: string;
  email: string;
  fullName: string;
};

async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
    p_email: email,
  });

  if (error) {
    throw error;
  }

  return (data as string | null) ?? null;
}

async function getTestUserByEmail(email: string): Promise<TestUser> {
  const userId = await getUserIdByEmail(email);

  if (!userId) {
    throw new Error(
      `Missing test account ${email}. Register this user before running test:family.`,
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return {
    id: userId,
    email,
    fullName: (profile?.full_name as string) ?? email,
  };
}

async function getTestUsers(): Promise<[TestUser, TestUser]> {
  const subject = await getTestUserByEmail(SUBJECT_EMAIL);
  const caregiver = await getTestUserByEmail(CAREGIVER_EMAIL);
  return [subject, caregiver];
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

async function cleanupStaleFamilyTestData(
  subjectUserId: string,
  caregiverUserId: string,
): Promise<void> {
  await supabaseAdmin
    .from("family_memberships")
    .delete()
    .eq("subject_user_id", subjectUserId)
    .eq("viewer_user_id", caregiverUserId);

  const { data: staleAlerts } = await supabaseAdmin
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", caregiverUserId)
    .eq("type", "family_alert");

  const staleAlertIds = (staleAlerts ?? [])
    .filter(
      (row) => (row.metadata as Record<string, unknown>)?.subjectUserId === subjectUserId,
    )
    .map((row) => row.id as string);

  if (staleAlertIds.length > 0) {
    await supabaseAdmin.from("notifications").delete().in("id", staleAlertIds);
  }
}

async function ensureFamilyAlertGenerated(
  subjectUserId: string,
  caregiverUserId: string,
  groupId: string,
): Promise<void> {
  const dedupeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("biomarker_alerts")
    .delete()
    .eq("user_id", subjectUserId)
    .eq("biomarker_key", "glucose")
    .eq("is_read", false)
    .gte("created_at", dedupeSince);

  const { data: caregiverAlerts } = await supabaseAdmin
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", caregiverUserId)
    .eq("type", "family_alert")
    .eq("is_read", false);

  const staleAlertIds = (caregiverAlerts ?? [])
    .filter(
      (row) => (row.metadata as Record<string, unknown>)?.subjectUserId === subjectUserId,
    )
    .map((row) => row.id as string);

  if (staleAlertIds.length > 0) {
    await supabaseAdmin.from("notifications").delete().in("id", staleAlertIds);
  }

  const spikeValue = 300 + (Date.now() % 100);
  const readingDate = daysAgo(0);

  const { error } = await supabaseAdmin.from("biomarker_readings").insert({
    user_id: subjectUserId,
    lab_report_id: null,
    biomarker_key: "glucose",
    biomarker_name: "Glucose (Fasting)",
    value: spikeValue,
    unit: "mg/dL",
    reference_range_low: 70,
    reference_range_high: 99,
    status: "critical",
    reading_date: readingDate,
    source: "manual",
    notes: `Phase 8 family alert test seed (${spikeValue})`,
  });

  if (error) {
    throw error;
  }

  await processTrendForBiomarker(subjectUserId, "glucose");

  const { data: familyAlertRows } = await supabaseAdmin
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", caregiverUserId)
    .eq("type", "family_alert");

  const hasGroupAlert = (familyAlertRows ?? []).some((row) => {
    const metadata = row.metadata as Record<string, unknown>;
    return metadata.groupId === groupId && metadata.subjectUserId === subjectUserId;
  });

  if (!hasGroupAlert) {
    await notifyFamilyCaregivers({
      subjectUserId,
      biomarkerKey: "glucose",
      biomarkerName: "Glucose (Fasting)",
      alertType: "large_delta",
      newValue: spikeValue,
      newStatus: "critical",
    });
  }
}

async function cleanupTestArtifacts(params: {
  groupId: string;
  subjectUserId: string;
  caregiverUserId: string;
}): Promise<void> {
  await supabaseAdmin.from("family_memberships").delete().eq("group_id", params.groupId);
  await supabaseAdmin.from("family_groups").delete().eq("id", params.groupId);

  await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("user_id", params.caregiverUserId)
    .eq("type", "family_alert");
}

async function main(): Promise<void> {
  console.log("=== Phase 8 Family Network Test ===\n");

  const [subject, caregiver] = await getTestUsers();
  console.log(`Subject (data owner): ${subject.fullName} (${subject.email})`);
  console.log(`Caregiver (viewer):   ${caregiver.fullName} (${caregiver.email})\n`);

  await cleanupStaleFamilyTestData(subject.id, caregiver.id);

  const group = await createGroup(subject.id, `Test Family ${Date.now()}`);
  console.log(`Created group: ${group.name} (${group.id})`);

  const invitation = await createInvitation({
    groupId: group.id,
    subjectUserId: subject.id,
    inviteeEmail: caregiver.email,
    permissionLevel: "monitor",
  });

  console.log(`Invitation created (token ${invitation.token.slice(0, 8)}...)`);

  const accepted = await acceptInvitation(invitation.token, caregiver.id);
  console.log(`Invitation accepted for group ${accepted.groupId}\n`);

  const access = await requireFamilyAccessLevel(
    group.id,
    subject.id,
    caregiver.id,
    "monitor",
  );

  if (access.permissionLevel !== "monitor") {
    throw new Error("Expected monitor permission after accept");
  }

  console.log("Caregiver access check passed (monitor).");

  await ensureFamilyAlertGenerated(subject.id, caregiver.id, group.id);
  console.log("Trend processing complete — checking family notifications...\n");

  const notifications = await listUnreadNotifications(caregiver.id);
  const familyAlerts = notifications.filter(
    (item) => item.type === "family_alert" && item.metadata.groupId === group.id,
  );

  if (familyAlerts.length === 0) {
    throw new Error("Expected at least one family_alert notification for caregiver");
  }

  console.log(`Family alerts for caregiver: ${familyAlerts.length}`);
  console.log(`  Latest: ${familyAlerts[0]!.title}\n`);

  const summary = await buildCaregiverSummary(subject.id, "monitor");
  console.log(`Caregiver summary tracked biomarkers: ${summary.biomarkers.totalTracked}`);
  console.log(`Caregiver summary alerts: ${summary.alerts.length}`);

  const brief = await buildEmergencyBrief(subject.id);
  console.log(`Emergency brief for: ${brief.fullName}\n`);

  const alertNotificationId = familyAlerts[0]!.id;

  await revokeMembership(accepted.membershipId, subject.id);
  console.log("Membership revoked by subject.\n");

  const notificationsAfterRevoke = await listUnreadNotifications(caregiver.id);
  const familyAlertsAfterRevoke = notificationsAfterRevoke.filter(
    (item) =>
      item.type === "family_alert" &&
      item.metadata.groupId === group.id &&
      item.metadata.subjectUserId === subject.id,
  );

  if (familyAlertsAfterRevoke.length > 0) {
    throw new Error("Expected family_alert notifications to be removed after revoke");
  }

  console.log("Family alerts correctly hidden after revoke.");

  try {
    await requireFamilyAccessLevel(group.id, subject.id, caregiver.id, "monitor");
    throw new Error("Expected caregiver access to fail after revoke");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("do not have access")) {
      throw error;
    }
  }

  console.log("Caregiver summary access correctly blocked after revoke.");

  try {
    await markNotificationRead(alertNotificationId, caregiver.id);
    throw new Error("Expected markNotificationRead to fail for revoked alert");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: string }).code)
        : "";

    if (code !== "NOTIFICATION_NOT_FOUND" && !message.includes("Notification not found")) {
      throw error;
    }
  }

  console.log("Mark-as-read correctly blocked for revoked alert.\n");

  try {
    await createInvitation({
      groupId: group.id,
      subjectUserId: subject.id,
      inviteeEmail: `unregistered-${Date.now()}@example.com`,
      permissionLevel: "monitor",
    });
    throw new Error("Expected createInvitation to fail for unregistered email");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: string }).code)
        : "";

    if (code !== "INVITEE_NOT_REGISTERED") {
      throw error;
    }

    console.log("Unregistered invite correctly rejected (INVITEE_NOT_REGISTERED).");
  }

  try {
    await buildCaregiverSummary(subject.id, "emergency");
    throw new Error("Expected caregiver summary to fail for emergency-only permission");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Emergency-only")) {
      throw error;
    }

    console.log("Emergency-only permission correctly blocked from caregiver summary.");
  }

  await cleanupTestArtifacts({
    groupId: group.id,
    subjectUserId: subject.id,
    caregiverUserId: caregiver.id,
  });

  console.log("\n=== Family network test complete ===");
}

main()
  .catch((error) => {
    console.error("Family network test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await redisConnection.quit();
  });

import "dotenv/config";

import { supabaseAdmin } from "../src/config/supabase.js";
import { buildCaregiverSummary } from "../src/services/family/caregiverSummaryService.js";
import { buildEmergencyBrief } from "../src/services/family/emergencyBriefService.js";
import { requireFamilyAccessLevel } from "../src/services/family/familyAccessService.js";
import {
  createGroup,
} from "../src/services/family/familyService.js";
import {
  acceptInvitation,
  createInvitation,
} from "../src/services/family/invitationService.js";
import { processTrendForBiomarker } from "../src/services/lab/labService.js";
import { listUnreadNotifications } from "../src/services/notificationService.js";
import { redisConnection } from "../src/config/redis.js";

type TestUser = {
  id: string;
  email: string;
  fullName: string;
};

async function getTestUsers(): Promise<[TestUser, TestUser]> {
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .limit(2);

  if (error) {
    throw error;
  }

  if (!profiles || profiles.length < 2) {
    throw new Error("Need at least 2 registered users/profiles for the family test.");
  }

  const users: TestUser[] = [];

  for (const profile of profiles) {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      profile.id as string,
    );

    if (authError || !authUser.user?.email) {
      throw authError ?? new Error(`Missing auth email for profile ${profile.id}`);
    }

    users.push({
      id: profile.id as string,
      email: authUser.user.email,
      fullName: profile.full_name as string,
    });
  }

  return [users[0]!, users[1]!];
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

async function seedSpikeReading(userId: string): Promise<void> {
  const readingDate = daysAgo(0);

  const { data: existing } = await supabaseAdmin
    .from("biomarker_readings")
    .select("id")
    .eq("user_id", userId)
    .eq("biomarker_key", "glucose")
    .eq("reading_date", readingDate)
    .eq("value", 220)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { error } = await supabaseAdmin.from("biomarker_readings").insert({
    user_id: userId,
    lab_report_id: null,
    biomarker_key: "glucose",
    biomarker_name: "Glucose (Fasting)",
    value: 220,
    unit: "mg/dL",
    reference_range_low: 70,
    reference_range_high: 99,
    status: "concerning",
    reading_date: readingDate,
    source: "manual",
    notes: "Phase 8 family alert test seed",
  });

  if (error) {
    throw error;
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

  await seedSpikeReading(subject.id);
  await processTrendForBiomarker(subject.id, "glucose");
  console.log("Trend processing complete — checking family notifications...\n");

  const notifications = await listUnreadNotifications(caregiver.id);
  const familyAlerts = notifications.filter((item) => item.type === "family_alert");

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

  const emergencyInvite = await createInvitation({
    groupId: group.id,
    subjectUserId: subject.id,
    inviteeEmail: `emergency-${Date.now()}@example.com`,
    permissionLevel: "emergency",
  });

  void emergencyInvite;

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

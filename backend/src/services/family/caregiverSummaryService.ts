import { supabaseAdmin } from "../../config/supabase.js";
import type { PermissionLevel } from "../../types/family.js";
import { listUnreadAlerts, listTrackedBiomarkers } from "../lab/labService.js";
import { FamilyError } from "./familyService.js";

export type CaregiverSummary = {
  subjectUserId: string;
  permissionLevel: PermissionLevel;
  biomarkers: Awaited<ReturnType<typeof listTrackedBiomarkers>>;
  alerts: Awaited<ReturnType<typeof listUnreadAlerts>>;
  activePrescriptions: Array<{
    medicationName: string;
    dosage: string | null;
    frequency: string | null;
  }>;
  lastDocumentDate: string | null;
};

export async function buildCaregiverSummary(
  subjectUserId: string,
  permissionLevel: PermissionLevel,
): Promise<CaregiverSummary> {
  if (permissionLevel === "emergency") {
    throw new FamilyError(
      "Emergency-only access cannot view the caregiver summary",
      403,
      "INSUFFICIENT_PERMISSION",
    );
  }

  const [biomarkers, alerts] = await Promise.all([
    listTrackedBiomarkers(subjectUserId),
    listUnreadAlerts(subjectUserId),
  ]);

  const { data: prescriptions, error: rxError } = await supabaseAdmin
    .from("prescriptions")
    .select("medication_name, dosage, frequency")
    .eq("user_id", subjectUserId)
    .eq("is_active", true)
    .order("medication_name", { ascending: true });

  if (rxError) {
    throw new FamilyError(rxError.message, 500, "INTERNAL_ERROR");
  }

  const { data: lastDocument, error: docError } = await supabaseAdmin
    .from("documents")
    .select("document_date")
    .eq("user_id", subjectUserId)
    .order("document_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (docError) {
    throw new FamilyError(docError.message, 500, "INTERNAL_ERROR");
  }

  return {
    subjectUserId,
    permissionLevel,
    biomarkers,
    alerts,
    activePrescriptions: (prescriptions ?? []).map((row) => ({
      medicationName: row.medication_name as string,
      dosage: (row.dosage as string | null) ?? null,
      frequency: (row.frequency as string | null) ?? null,
    })),
    lastDocumentDate: (lastDocument?.document_date as string | null) ?? null,
  };
}

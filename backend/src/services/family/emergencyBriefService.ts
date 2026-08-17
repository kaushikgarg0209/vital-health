import { supabaseAdmin } from "../../config/supabase.js";
import { getProfileByUserId } from "../profileService.js";
import { FamilyError } from "./familyService.js";

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

export async function buildEmergencyBrief(subjectUserId: string): Promise<EmergencyBrief> {
  const profile = await getProfileByUserId(subjectUserId);

  if (!profile) {
    throw new FamilyError("Profile not found", 404, "PROFILE_NOT_FOUND");
  }

  const { data: prescriptions, error } = await supabaseAdmin
    .from("prescriptions")
    .select("medication_name, dosage, frequency, prescribing_doctor")
    .eq("user_id", subjectUserId)
    .eq("is_active", true)
    .order("medication_name", { ascending: true });

  if (error) {
    throw new FamilyError(error.message, 500, "INTERNAL_ERROR");
  }

  return {
    fullName: profile.full_name,
    dateOfBirth: profile.date_of_birth,
    biologicalSex: profile.biological_sex,
    bloodType: profile.blood_type,
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg,
    knownConditions: profile.known_conditions,
    allergies: profile.allergies,
    currentMedications: profile.current_medications,
    emergencyContactName: profile.emergency_contact_name,
    emergencyContactPhone: profile.emergency_contact_phone,
    primaryCareDoctor: profile.primary_care_doctor,
    activePrescriptions: (prescriptions ?? []).map((row) => ({
      medicationName: row.medication_name as string,
      dosage: (row.dosage as string | null) ?? null,
      frequency: (row.frequency as string | null) ?? null,
      prescribingDoctor: (row.prescribing_doctor as string | null) ?? null,
    })),
  };
}

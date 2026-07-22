export type BiologicalSex = "male" | "female" | "other";

export type Profile = {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  biologicalSex: BiologicalSex | null;
  heightCm: number | null;
  weightKg: number | null;
  bloodType: string | null;
  knownConditions: string[];
  allergies: string[];
  currentMedications: string[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileInput = {
  fullName?: string;
  dateOfBirth?: string | null;
  biologicalSex?: BiologicalSex | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bloodType?: string | null;
  knownConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
};

export type ProfileFormValues = {
  fullName: string;
  dateOfBirth: string;
  biologicalSex: BiologicalSex | "";
  heightCm: string;
  weightKg: string;
  bloodType: string;
  knownConditions: string[];
  allergies: string[];
  currentMedications: string[];
};

export function profileToFormValues(profile: Profile | null, fallbackName = ""): ProfileFormValues {
  return {
    fullName: profile?.fullName ?? fallbackName,
    dateOfBirth: profile?.dateOfBirth ?? "",
    biologicalSex: profile?.biologicalSex ?? "",
    heightCm: profile?.heightCm != null ? String(profile.heightCm) : "",
    weightKg: profile?.weightKg != null ? String(profile.weightKg) : "",
    bloodType: profile?.bloodType ?? "",
    knownConditions: profile?.knownConditions ?? [],
    allergies: profile?.allergies ?? [],
    currentMedications: profile?.currentMedications ?? [],
  };
}

export function formValuesToUpdateInput(values: ProfileFormValues): UpdateProfileInput {
  return {
    fullName: values.fullName.trim(),
    dateOfBirth: values.dateOfBirth || null,
    biologicalSex: values.biologicalSex || null,
    heightCm: values.heightCm ? Number(values.heightCm) : null,
    weightKg: values.weightKg ? Number(values.weightKg) : null,
    bloodType: values.bloodType.trim() || null,
    knownConditions: values.knownConditions,
    allergies: values.allergies,
    currentMedications: values.currentMedications,
  };
}

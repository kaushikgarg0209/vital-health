export type BiologicalSex = "male" | "female" | "other";

/** Database row shape (snake_case). */
export type ProfileRow = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  biological_sex: BiologicalSex | null;
  height_cm: number | string | null;
  weight_kg: number | string | null;
  blood_type: string | null;
  known_conditions: string[] | null;
  allergies: string[] | null;
  current_medications: string[] | null;
  created_at: string;
  updated_at: string;
};

/** Internal domain model mapped from the database (snake_case). */
export type Profile = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  biological_sex: BiologicalSex | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  known_conditions: string[];
  allergies: string[];
  current_medications: string[];
  created_at: string;
  updated_at: string;
};

/** API response shape (camelCase). */
export type ProfileResponse = {
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

export type ProfileSessionSummary = {
  fullName: string;
  dateOfBirth: string | null;
  biologicalSex: BiologicalSex | null;
  hasCompletedSetup: boolean;
};

export function toProfileResponse(profile: Profile): ProfileResponse {
  return {
    id: profile.id,
    fullName: profile.full_name,
    dateOfBirth: profile.date_of_birth,
    biologicalSex: profile.biological_sex,
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg,
    bloodType: profile.blood_type,
    knownConditions: profile.known_conditions,
    allergies: profile.allergies,
    currentMedications: profile.current_medications,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export function toProfileSessionSummary(profile: Profile): ProfileSessionSummary {
  return {
    fullName: profile.full_name,
    dateOfBirth: profile.date_of_birth,
    biologicalSex: profile.biological_sex,
    hasCompletedSetup: Boolean(profile.date_of_birth && profile.biological_sex),
  };
}

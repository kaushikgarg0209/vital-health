import { supabaseAdmin } from "../config/supabase.js";
import type { UpdateProfileInput } from "../schemas/profileSchemas.js";
import type { Profile, ProfileRow } from "../types/profile.js";

export class ProfileError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    full_name: row.full_name,
    date_of_birth: row.date_of_birth,
    biological_sex: row.biological_sex,
    height_cm: toNumber(row.height_cm),
    weight_kg: toNumber(row.weight_kg),
    blood_type: row.blood_type,
    known_conditions: row.known_conditions ?? [],
    allergies: row.allergies ?? [],
    current_medications: row.current_medications ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapUpdateInput(input: UpdateProfileInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.fullName !== undefined) {
    payload.full_name = input.fullName;
  }
  if (input.dateOfBirth !== undefined) {
    payload.date_of_birth = input.dateOfBirth;
  }
  if (input.biologicalSex !== undefined) {
    payload.biological_sex = input.biologicalSex;
  }
  if (input.heightCm !== undefined) {
    payload.height_cm = input.heightCm;
  }
  if (input.weightKg !== undefined) {
    payload.weight_kg = input.weightKg;
  }
  if (input.bloodType !== undefined) {
    payload.blood_type = input.bloodType?.toUpperCase() ?? null;
  }
  if (input.knownConditions !== undefined) {
    payload.known_conditions = input.knownConditions;
  }
  if (input.allergies !== undefined) {
    payload.allergies = input.allergies;
  }
  if (input.currentMedications !== undefined) {
    payload.current_medications = input.currentMedications;
  }

  return payload;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new ProfileError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    return null;
  }

  return mapProfile(data as ProfileRow);
}

export async function upsertProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  const updates = mapUpdateInput(input);

  if (Object.keys(updates).length === 0) {
    throw new ProfileError("No profile fields provided to update", 400, "VALIDATION_ERROR");
  }

  const existing = await getProfileByUserId(userId);

  if (!existing) {
    const fullName =
      typeof updates.full_name === "string" ? updates.full_name.trim() : "";

    if (!fullName) {
      throw new ProfileError(
        "Full name is required to create a profile",
        400,
        "VALIDATION_ERROR",
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, ...updates })
      .select("*")
      .single();

    if (error) {
      throw new ProfileError(error.message, 500, "INTERNAL_ERROR");
    }

    return mapProfile(data as ProfileRow);
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new ProfileError(error.message, 500, "INTERNAL_ERROR");
  }

  return mapProfile(data as ProfileRow);
}

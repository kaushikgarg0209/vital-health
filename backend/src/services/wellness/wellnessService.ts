import { supabaseAdmin } from "../../config/supabase.js";
import { calculateAge } from "../lab/referenceRangeService.js";
import { listTrackedBiomarkers } from "../lab/labService.js";
import { getProfileByUserId, upsertProfile } from "../profileService.js";
import type { Profile } from "../../types/profile.js";
import type {
  NutritionTargets,
  WellnessPlan,
  WellnessPlanRow,
  WellnessPreferences,
  WellnessPreferencesRow,
  WellnessReadiness,
  WeightMeasurement,
  WeightMeasurementRow,
  WeightSource,
  WeeklyCheckin,
  WeeklyCheckinRow,
} from "../../types/wellness.js";
import type {
  AddWeightMeasurementInput,
  UpdateWellnessPreferencesInput,
} from "../../schemas/wellnessSchemas.js";
import {
  calculateNutritionTargets,
  type LabSignal,
} from "./nutritionCalculator.js";

export class WellnessError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "WellnessError";
  }
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapPreferences(row: WellnessPreferencesRow): WellnessPreferences {
  const complete =
    row.dietary_preference !== null &&
    row.country_code !== null &&
    row.activity_level !== null &&
    row.work_routine !== null &&
    row.fitness_goal !== null &&
    row.completed_at !== null;

  return {
    userId: row.user_id,
    dietaryPreference: row.dietary_preference,
    countryCode: row.country_code,
    cuisineNotes: row.cuisine_notes,
    activityLevel: row.activity_level,
    workRoutine: row.work_routine,
    fitnessGoal: row.fitness_goal,
    targetWeightKg: toNumber(row.target_weight_kg),
    typicalSleepHours: toNumber(row.typical_sleep_hours),
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
    isComplete: complete,
  };
}

function mapWeight(row: WeightMeasurementRow): WeightMeasurement {
  return {
    id: row.id,
    weightKg: toNumber(row.weight_kg) ?? 0,
    recordedAt: row.recorded_at,
    source: row.source,
    notes: row.notes,
  };
}

function mapPlan(row: WellnessPlanRow): WellnessPlan {
  return {
    id: row.id,
    status: row.status,
    plan: row.plan_json,
    nutritionTargets: row.nutrition_targets_json,
    currentWeek: row.current_week,
    generatedAt: row.generated_at,
    completedAt: row.completed_at,
  };
}

function mapCheckin(row: WeeklyCheckinRow): WeeklyCheckin {
  return {
    id: row.id,
    planId: row.plan_id,
    weekNumber: row.week_number,
    weightKg: toNumber(row.weight_kg),
    adherenceScore: row.adherence_score,
    energyLevel: row.energy_level,
    sleepHoursAvg: toNumber(row.sleep_hours_avg),
    notes: row.notes,
    aiFeedback: row.ai_feedback,
    adjustedTargets: row.adjusted_targets,
    createdAt: row.created_at,
  };
}

export async function getWellnessPreferences(userId: string): Promise<WellnessPreferences | null> {
  const { data, error } = await supabaseAdmin
    .from("wellness_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    return null;
  }

  return mapPreferences(data as WellnessPreferencesRow);
}

export async function upsertWellnessPreferences(
  userId: string,
  input: UpdateWellnessPreferencesInput,
): Promise<WellnessPreferences> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    dietary_preference: input.dietaryPreference,
    country_code: input.countryCode,
    cuisine_notes: input.cuisineNotes ?? null,
    activity_level: input.activityLevel,
    work_routine: input.workRoutine,
    fitness_goal: input.fitnessGoal,
    target_weight_kg: input.targetWeightKg ?? null,
    typical_sleep_hours: input.typicalSleepHours ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.markComplete) {
    payload.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("wellness_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  return mapPreferences(data as WellnessPreferencesRow);
}

export async function listWeightMeasurements(
  userId: string,
  limit = 52,
): Promise<WeightMeasurement[]> {
  const { data, error } = await supabaseAdmin
    .from("weight_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data as WeightMeasurementRow[]).map(mapWeight);
}

async function syncProfileWeight(userId: string, weightKg: number): Promise<void> {
  await upsertProfile(userId, { weightKg });
}

export async function addWeightMeasurement(
  userId: string,
  input: AddWeightMeasurementInput,
  source: WeightSource = "manual",
): Promise<WeightMeasurement> {
  const { data, error } = await supabaseAdmin
    .from("weight_measurements")
    .insert({
      user_id: userId,
      weight_kg: input.weightKg,
      recorded_at: input.recordedAt ?? new Date().toISOString(),
      source,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  await syncProfileWeight(userId, input.weightKg);

  return mapWeight(data as WeightMeasurementRow);
}

export async function seedWeightFromProfile(userId: string, profile: Profile): Promise<void> {
  if (!profile.weight_kg) {
    return;
  }

  const { count, error } = await supabaseAdmin
    .from("weight_measurements")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  if ((count ?? 0) > 0) {
    return;
  }

  await addWeightMeasurement(
    userId,
    { weightKg: profile.weight_kg },
    "profile_update",
  );
}

function extractLabSignals(
  categories: Awaited<ReturnType<typeof listTrackedBiomarkers>>["categories"],
): LabSignal[] {
  const signals: LabSignal[] = [];

  for (const category of categories) {
    for (const biomarker of category.biomarkers) {
      if (!biomarker.status) {
        continue;
      }
      signals.push({
        biomarkerKey: biomarker.biomarkerKey,
        biomarkerName: biomarker.displayName,
        status: biomarker.status,
      });
    }
  }

  return signals;
}

export async function computeNutritionTargetsForUser(
  userId: string,
): Promise<NutritionTargets> {
  const profile = await getProfileByUserId(userId);
  const preferences = await getWellnessPreferences(userId);

  if (!profile?.date_of_birth || !profile.biological_sex || !profile.height_cm || !profile.weight_kg) {
    throw new WellnessError(
      "Complete your profile with age, sex, height, and weight first",
      400,
      "PROFILE_INCOMPLETE",
    );
  }

  if (!preferences?.activityLevel || !preferences.fitnessGoal) {
    throw new WellnessError(
      "Complete your wellness preferences first",
      400,
      "PREFERENCES_INCOMPLETE",
    );
  }

  const age = calculateAge(profile.date_of_birth);
  if (age === null) {
    throw new WellnessError("Invalid date of birth on profile", 400, "PROFILE_INCOMPLETE");
  }

  const labOverview = await listTrackedBiomarkers(userId);
  const labSignals = extractLabSignals(labOverview.categories);

  return calculateNutritionTargets({
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age,
    biologicalSex: profile.biological_sex,
    activityLevel: preferences.activityLevel,
    fitnessGoal: preferences.fitnessGoal,
    knownConditions: profile.known_conditions,
    labSignals,
  });
}

export async function getWellnessReadiness(userId: string): Promise<WellnessReadiness> {
  const profile = await getProfileByUserId(userId);
  const preferences = await getWellnessPreferences(userId);
  const weights = await listWeightMeasurements(userId, 1);
  const labOverview = await listTrackedBiomarkers(userId);

  const missing: string[] = [];

  if (!profile?.date_of_birth) {
    missing.push("date_of_birth");
  }
  if (!profile?.biological_sex) {
    missing.push("biological_sex");
  }
  if (!profile?.height_cm) {
    missing.push("height_cm");
  }
  if (!profile?.weight_kg && weights.length === 0) {
    missing.push("weight_kg");
  }
  if (!preferences?.isComplete) {
    missing.push("wellness_preferences");
  }

  const hasConcerningOrBorderlineBiomarkers =
    labOverview.concerningCount > 0 || labOverview.borderlineCount > 0;

  const generalWellnessOk =
    preferences?.fitnessGoal === "general_wellness" && preferences.isComplete;

  const canGeneratePlan =
    missing.length === 0 &&
    (hasConcerningOrBorderlineBiomarkers || generalWellnessOk);

  if (
    missing.length === 0 &&
    !hasConcerningOrBorderlineBiomarkers &&
    !generalWellnessOk
  ) {
    missing.push("lab_data_or_general_wellness_goal");
  }

  return {
    canGeneratePlan,
    missing,
    hasConcerningOrBorderlineBiomarkers,
  };
}

const PROFILE_AND_PREFERENCE_REQUIREMENTS = [
  "date_of_birth",
  "biological_sex",
  "height_cm",
  "weight_kg",
  "wellness_preferences",
] as const;

function isProfileAndPreferencesReady(missing: string[]): boolean {
  return !missing.some((item) =>
    PROFILE_AND_PREFERENCE_REQUIREMENTS.includes(
      item as (typeof PROFILE_AND_PREFERENCE_REQUIREMENTS)[number],
    ),
  );
}

function formatNotReadyMessage(missing: string[]): string {
  const base =
    "Complete required profile, wellness preferences, and lab data before generating a plan";
  if (missing.length === 0) {
    return base;
  }
  return `${base}. Missing: ${missing.join(", ")}`;
}

export async function getActiveWellnessPlan(userId: string): Promise<WellnessPlan | null> {
  const { data, error } = await supabaseAdmin
    .from("wellness_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    return null;
  }

  return mapPlan(data as WellnessPlanRow);
}

export async function archiveActivePlans(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("wellness_plans")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }
}

export async function storeWellnessPlan(
  userId: string,
  planContent: WellnessPlan["plan"],
  nutritionTargets: NutritionTargets,
): Promise<WellnessPlan> {
  await archiveActivePlans(userId);

  const { data, error } = await supabaseAdmin
    .from("wellness_plans")
    .insert({
      user_id: userId,
      status: "active",
      plan_json: planContent,
      nutrition_targets_json: nutritionTargets,
      current_week: 1,
    })
    .select("*")
    .single();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  return mapPlan(data as WellnessPlanRow);
}

export async function getWellnessPlanById(
  userId: string,
  planId: string,
): Promise<WellnessPlan> {
  const { data, error } = await supabaseAdmin
    .from("wellness_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    throw new WellnessError("Wellness plan not found", 404, "PLAN_NOT_FOUND");
  }

  return mapPlan(data as WellnessPlanRow);
}

export async function listCheckinsForPlan(planId: string): Promise<WeeklyCheckin[]> {
  const { data, error } = await supabaseAdmin
    .from("weekly_checkins")
    .select("*")
    .eq("plan_id", planId)
    .order("week_number", { ascending: true });

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data as WeeklyCheckinRow[]).map(mapCheckin);
}

export async function getCheckinForWeek(
  planId: string,
  weekNumber: number,
): Promise<WeeklyCheckin | null> {
  const { data, error } = await supabaseAdmin
    .from("weekly_checkins")
    .select("*")
    .eq("plan_id", planId)
    .eq("week_number", weekNumber)
    .maybeSingle();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    return null;
  }

  return mapCheckin(data as WeeklyCheckinRow);
}

export async function storeWeeklyCheckin(
  userId: string,
  planId: string,
  weekNumber: number,
  input: {
    weightKg?: number;
    adherenceScore: number;
    energyLevel: number;
    sleepHoursAvg?: number | null;
    notes?: string | null;
    aiFeedback: string;
    adjustedTargets?: Record<string, unknown> | null;
  },
): Promise<WeeklyCheckin> {
  const plan = await getWellnessPlanById(userId, planId);

  if (plan.status !== "active") {
    throw new WellnessError("Plan is not active", 400, "PLAN_NOT_ACTIVE");
  }

  const existing = await getCheckinForWeek(planId, weekNumber);
  if (existing) {
    throw new WellnessError("Check-in already submitted for this week", 409, "CHECKIN_EXISTS");
  }

  if (input.weightKg !== undefined) {
    await addWeightMeasurement(userId, { weightKg: input.weightKg }, "check_in");
  }

  const nextWeek = Math.min(weekNumber + 1, 4);
  const planUpdate: Record<string, unknown> = {
    current_week: nextWeek,
    updated_at: new Date().toISOString(),
  };

  if (weekNumber >= 4) {
    planUpdate.status = "completed";
    planUpdate.completed_at = new Date().toISOString();
  }

  const { error: planError } = await supabaseAdmin
    .from("wellness_plans")
    .update(planUpdate)
    .eq("id", planId);

  if (planError) {
    throw new WellnessError(planError.message, 500, "INTERNAL_ERROR");
  }

  const { data, error } = await supabaseAdmin
    .from("weekly_checkins")
    .insert({
      plan_id: planId,
      week_number: weekNumber,
      weight_kg: input.weightKg ?? null,
      adherence_score: input.adherenceScore,
      energy_level: input.energyLevel,
      sleep_hours_avg: input.sleepHoursAvg ?? null,
      notes: input.notes ?? null,
      ai_feedback: input.aiFeedback,
      adjusted_targets: input.adjustedTargets ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }

  return mapCheckin(data as WeeklyCheckinRow);
}

export async function updatePlanNutritionTargets(
  planId: string,
  nutritionTargets: NutritionTargets,
  planContent: WellnessPlan["plan"],
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("wellness_plans")
    .update({
      nutrition_targets_json: nutritionTargets,
      plan_json: planContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) {
    throw new WellnessError(error.message, 500, "INTERNAL_ERROR");
  }
}

export async function buildFitnessPlanContext(userId: string): Promise<{
  profile: Profile;
  preferences: WellnessPreferences;
  nutritionTargets: NutritionTargets;
  weightHistory: WeightMeasurement[];
  labOverview: Awaited<ReturnType<typeof listTrackedBiomarkers>>;
}> {
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    throw new WellnessError("Profile not found", 404, "PROFILE_NOT_FOUND");
  }

  await seedWeightFromProfile(userId, profile);

  const readiness = await getWellnessReadiness(userId);
  const activePlan = await getActiveWellnessPlan(userId);
  const canRegenerate =
    Boolean(activePlan) && isProfileAndPreferencesReady(readiness.missing);

  if (!readiness.canGeneratePlan && !canRegenerate) {
    throw new WellnessError(formatNotReadyMessage(readiness.missing), 400, "NOT_READY");
  }

  const preferences = await getWellnessPreferences(userId);
  if (!preferences) {
    throw new WellnessError("Wellness preferences not found", 400, "PREFERENCES_INCOMPLETE");
  }

  const nutritionTargets = await computeNutritionTargetsForUser(userId);
  const weightHistory = await listWeightMeasurements(userId, 8);
  const labOverview = await listTrackedBiomarkers(userId);

  return { profile, preferences, nutritionTargets, weightHistory, labOverview };
}

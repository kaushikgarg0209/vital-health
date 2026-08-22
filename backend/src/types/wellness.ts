export type DietaryPreference =
  | "vegetarian"
  | "non_vegetarian"
  | "vegan"
  | "eggetarian"
  | "pescatarian";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

export type WorkRoutine =
  | "desk_job"
  | "shift_work"
  | "physical_labor"
  | "retired"
  | "student"
  | "homemaker";

export type FitnessGoal =
  | "lose_weight"
  | "maintain"
  | "gain_muscle"
  | "improve_biomarkers"
  | "general_wellness";

export type WeightSource = "manual" | "check_in" | "profile_update";

export type WellnessPlanStatus = "active" | "completed" | "archived";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type NutritionTargets = {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  bmr: number;
  tdee: number;
  bmi: number;
  bmiCategory: string;
  rationale: string;
  labAdjustments: string[];
};

export type MealSuggestion = {
  meal: MealSlot;
  suggestion: string;
  why: string;
};

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DailyMealPlan = {
  day: DayOfWeek;
  meals: MealSuggestion[];
};

export type WellnessPlanWeek = {
  weekNumber: number;
  activityTarget: string;
  dietaryGuidance: string;
  dailyMealPlans?: DailyMealPlan[];
  mealSuggestions?: MealSuggestion[];
  sleepTarget: string;
  milestone: string;
};

export type WellnessPlanContent = {
  overview: string;
  nutritionTargets: {
    dailyCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    rationale: string;
  };
  weeks: WellnessPlanWeek[];
};

export type WellnessPreferencesRow = {
  user_id: string;
  dietary_preference: DietaryPreference | null;
  country_code: string | null;
  cuisine_notes: string | null;
  activity_level: ActivityLevel | null;
  work_routine: WorkRoutine | null;
  fitness_goal: FitnessGoal | null;
  target_weight_kg: number | string | null;
  typical_sleep_hours: number | string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WellnessPreferences = {
  userId: string;
  dietaryPreference: DietaryPreference | null;
  countryCode: string | null;
  cuisineNotes: string | null;
  activityLevel: ActivityLevel | null;
  workRoutine: WorkRoutine | null;
  fitnessGoal: FitnessGoal | null;
  targetWeightKg: number | null;
  typicalSleepHours: number | null;
  completedAt: string | null;
  updatedAt: string;
  isComplete: boolean;
};

export type WeightMeasurementRow = {
  id: string;
  user_id: string;
  weight_kg: number | string;
  recorded_at: string;
  source: WeightSource;
  notes: string | null;
  created_at: string;
};

export type WeightMeasurement = {
  id: string;
  weightKg: number;
  recordedAt: string;
  source: WeightSource;
  notes: string | null;
};

export type WellnessPlanRow = {
  id: string;
  user_id: string;
  status: WellnessPlanStatus;
  plan_json: WellnessPlanContent;
  nutrition_targets_json: NutritionTargets;
  current_week: number;
  generated_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WellnessPlan = {
  id: string;
  status: WellnessPlanStatus;
  plan: WellnessPlanContent;
  nutritionTargets: NutritionTargets;
  currentWeek: number;
  generatedAt: string;
  completedAt: string | null;
};

export type WeeklyCheckinRow = {
  id: string;
  plan_id: string;
  week_number: number;
  weight_kg: number | string | null;
  adherence_score: number;
  energy_level: number;
  sleep_hours_avg: number | string | null;
  notes: string | null;
  ai_feedback: string | null;
  adjusted_targets: Record<string, unknown> | null;
  created_at: string;
};

export type WeeklyCheckin = {
  id: string;
  planId: string;
  weekNumber: number;
  weightKg: number | null;
  adherenceScore: number;
  energyLevel: number;
  sleepHoursAvg: number | null;
  notes: string | null;
  aiFeedback: string | null;
  adjustedTargets: Record<string, unknown> | null;
  createdAt: string;
};

export type WellnessReadiness = {
  canGeneratePlan: boolean;
  missing: string[];
  hasConcerningOrBorderlineBiomarkers: boolean;
};

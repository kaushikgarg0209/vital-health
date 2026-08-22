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

export type UpdateWellnessPreferencesInput = {
  dietaryPreference: DietaryPreference;
  countryCode: string;
  cuisineNotes?: string | null;
  activityLevel: ActivityLevel;
  workRoutine: WorkRoutine;
  fitnessGoal: FitnessGoal;
  targetWeightKg?: number | null;
  typicalSleepHours?: number | null;
  markComplete?: boolean;
};

export type WeightMeasurement = {
  id: string;
  weightKg: number;
  recordedAt: string;
  source: "manual" | "check_in" | "profile_update";
  notes: string | null;
};

export type AddWeightMeasurementInput = {
  weightKg: number;
  recordedAt?: string;
  notes?: string | null;
};

export type WellnessPlan = {
  id: string;
  status: "active" | "completed" | "archived";
  plan: WellnessPlanContent;
  nutritionTargets: NutritionTargets;
  currentWeek: number;
  generatedAt: string;
  completedAt: string | null;
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

export type SubmitCheckinInput = {
  weekNumber: number;
  weightKg?: number;
  adherenceScore: number;
  energyLevel: number;
  sleepHoursAvg?: number | null;
  notes?: string | null;
};

export type WellnessReadiness = {
  canGeneratePlan: boolean;
  missing: string[];
  hasConcerningOrBorderlineBiomarkers: boolean;
};

export const DIETARY_PREFERENCE_LABELS: Record<DietaryPreference, string> = {
  vegetarian: "Vegetarian",
  non_vegetarian: "Non-vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  pescatarian: "Pescatarian",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  lightly_active: "Lightly active (1–3 days/week)",
  moderately_active: "Moderately active (3–5 days/week)",
  very_active: "Very active (6–7 days/week)",
};

export const WORK_ROUTINE_LABELS: Record<WorkRoutine, string> = {
  desk_job: "Desk job",
  shift_work: "Shift work",
  physical_labor: "Physical labor",
  retired: "Retired",
  student: "Student",
  homemaker: "Homemaker",
};

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_weight: "Lose weight",
  maintain: "Maintain weight",
  gain_muscle: "Gain muscle",
  improve_biomarkers: "Improve lab biomarkers",
  general_wellness: "General wellness",
};

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const READINESS_LABELS: Record<string, string> = {
  date_of_birth: "Date of birth",
  biological_sex: "Biological sex",
  height_cm: "Height",
  weight_kg: "Weight",
  wellness_preferences: "Wellness preferences",
  lab_data_or_general_wellness_goal: "Lab data or general wellness goal",
};

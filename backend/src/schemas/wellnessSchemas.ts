import { z } from "zod";
import { ISO_COUNTRY_CODES } from "../constants/isoCountries.js";

export const dietaryPreferenceSchema = z.enum([
  "vegetarian",
  "non_vegetarian",
  "vegan",
  "eggetarian",
  "pescatarian",
]);

export const activityLevelSchema = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
]);

export const workRoutineSchema = z.enum([
  "desk_job",
  "shift_work",
  "physical_labor",
  "retired",
  "student",
  "homemaker",
]);

export const fitnessGoalSchema = z.enum([
  "lose_weight",
  "maintain",
  "gain_muscle",
  "improve_biomarkers",
  "general_wellness",
]);

export const updateWellnessPreferencesSchema = z.object({
  dietaryPreference: dietaryPreferenceSchema,
  countryCode: z
    .string()
    .length(2)
    .toUpperCase()
    .refine((code) => ISO_COUNTRY_CODES.has(code), {
      message: "Country must be a valid ISO 3166-1 alpha-2 code",
    }),
  cuisineNotes: z.string().max(500).optional().nullable(),
  activityLevel: activityLevelSchema,
  workRoutine: workRoutineSchema,
  fitnessGoal: fitnessGoalSchema,
  targetWeightKg: z.number().min(20).max(500).optional().nullable(),
  typicalSleepHours: z.number().min(3).max(14).optional().nullable(),
  markComplete: z.boolean().optional(),
});

export const addWeightMeasurementSchema = z.object({
  weightKg: z.number().min(20).max(500),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const planIdParamSchema = z.object({
  planId: z.string().uuid(),
});

export const submitCheckinSchema = z.object({
  weekNumber: z.number().int().min(1).max(4),
  weightKg: z.number().min(20).max(500).optional(),
  adherenceScore: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5),
  sleepHoursAvg: z.number().min(0).max(24).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const mealSlotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const mealSuggestionSchema = z.object({
  meal: mealSlotSchema,
  suggestion: z.string().min(1),
  why: z.string().min(1),
});

export const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const dailyMealPlanSchema = z.object({
  day: dayOfWeekSchema,
  meals: z.array(mealSuggestionSchema).min(3).max(4),
});

export const wellnessPlanWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(4),
  activityTarget: z.string().min(1),
  dietaryGuidance: z.string().min(1),
  dailyMealPlans: z.array(dailyMealPlanSchema).length(7),
  sleepTarget: z.string().min(1),
  milestone: z.string().min(1),
});

export const checkinAdaptationSchema = z.object({
  feedback: z.string().min(1),
  adjustment: z.string().min(1),
  calorieDelta: z.number().int().min(-300).max(300),
});

export const wellnessPlanAiSchema = z.object({
  overview: z.string().min(1),
  weeks: z.array(wellnessPlanWeekSchema).length(4),
});

export const wellnessPlanContentSchema = wellnessPlanAiSchema.extend({
  nutritionTargets: z.object({
    dailyCalories: z.number().positive(),
    proteinG: z.number().positive(),
    carbsG: z.number().nonnegative(),
    fatG: z.number().nonnegative(),
    fiberG: z.number().positive(),
    rationale: z.string().min(1),
  }),
});

export type UpdateWellnessPreferencesInput = z.infer<typeof updateWellnessPreferencesSchema>;
export type AddWeightMeasurementInput = z.infer<typeof addWeightMeasurementSchema>;
export type SubmitCheckinInput = z.infer<typeof submitCheckinSchema>;

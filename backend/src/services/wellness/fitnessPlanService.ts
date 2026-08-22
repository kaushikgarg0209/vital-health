import { formatCountryLabel } from "../../constants/isoCountries.js";
import { env } from "../../config/env.js";
import { calculateAge } from "../lab/referenceRangeService.js";
import { generateJson } from "../ai/geminiJson.js";
import {
  wellnessPlanAiSchema,
  wellnessPlanContentSchema,
} from "../../schemas/wellnessSchemas.js";
import type { z } from "zod";
import type { NutritionTargets } from "../../types/wellness.js";
import {
  buildFitnessPlanContext,
  storeWellnessPlan,
  WellnessError,
} from "./wellnessService.js";

type WellnessPlanContent = z.infer<typeof wellnessPlanContentSchema>;

function formatLabContext(
  labOverview: Awaited<ReturnType<typeof buildFitnessPlanContext>>["labOverview"],
): string {
  const lines: string[] = [];

  for (const category of labOverview.categories) {
    for (const biomarker of category.biomarkers) {
      if (
        biomarker.status === "concerning" ||
        biomarker.status === "critical" ||
        biomarker.status === "borderline"
      ) {
        lines.push(
          `- ${biomarker.displayName}: ${biomarker.latestValue} ${biomarker.unit} (${biomarker.status}, trend: ${biomarker.trendDirection})`,
        );
      }
    }
  }

  return lines.length > 0 ? lines.join("\n") : "No concerning or borderline biomarkers.";
}

function formatWeightHistory(
  weights: Awaited<ReturnType<typeof buildFitnessPlanContext>>["weightHistory"],
): string {
  if (weights.length === 0) {
    return "No weight history.";
  }

  return weights
    .slice()
    .reverse()
    .map((entry) => `- ${entry.recordedAt.slice(0, 10)}: ${entry.weightKg} kg (${entry.source})`)
    .join("\n");
}

function nutritionTargetsForPlan(targets: NutritionTargets): WellnessPlanContent["nutritionTargets"] {
  return {
    dailyCalories: targets.dailyCalories,
    proteinG: targets.proteinG,
    carbsG: targets.carbsG,
    fatG: targets.fatG,
    fiberG: targets.fiberG,
    rationale: targets.rationale,
  };
}

function buildPrompt(
  context: Awaited<ReturnType<typeof buildFitnessPlanContext>>,
): string {
  const { profile, preferences, nutritionTargets, weightHistory, labOverview } = context;
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;

  return `You are a clinical wellness planner for Vital Health. Create a personalized 4-week fitness and nutrition plan grounded in the user's lab results and computed nutrition targets.

USER PROFILE:
- Age: ${age ?? "unknown"}
- Sex: ${profile.biological_sex ?? "unknown"}
- Height: ${profile.height_cm ?? "unknown"} cm
- Weight: ${profile.weight_kg ?? "unknown"} kg
- BMI: ${nutritionTargets.bmi} (${nutritionTargets.bmiCategory})
- Conditions: ${profile.known_conditions.join(", ") || "none"}
- Allergies: ${profile.allergies.join(", ") || "none"}
- Medications: ${profile.current_medications.join(", ") || "none"}

WELLNESS PREFERENCES:
- Diet: ${preferences.dietaryPreference}
- Country: ${preferences.countryCode ? formatCountryLabel(preferences.countryCode) : "unknown"}
- Cuisine notes: ${preferences.cuisineNotes ?? "none"}
- Activity level: ${preferences.activityLevel}
- Work routine: ${preferences.workRoutine}
- Goal: ${preferences.fitnessGoal}
- Target weight: ${preferences.targetWeightKg ?? "not set"} kg
- Typical sleep: ${preferences.typicalSleepHours ?? "not set"} hours

COMPUTED NUTRITION TARGETS (for context only — do NOT include in output JSON):
- Daily calories: ${nutritionTargets.dailyCalories}
- Protein: ${nutritionTargets.proteinG}g
- Carbs: ${nutritionTargets.carbsG}g
- Fat: ${nutritionTargets.fatG}g
- Fiber: ${nutritionTargets.fiberG}g
- TDEE: ${nutritionTargets.tdee} kcal
- Rationale: ${nutritionTargets.rationale}
- Lab adjustments: ${nutritionTargets.labAdjustments.join("; ") || "none"}

CONCERNING/BORDERLINE BIOMARKERS:
${formatLabContext(labOverview)}

WEIGHT HISTORY (recent):
${formatWeightHistory(weightHistory)}

OUTPUT JSON SHAPE:
{
  "overview": "string",
  "weeks": [
    {
      "weekNumber": 1,
      "activityTarget": "string",
      "dietaryGuidance": "string",
      "dailyMealPlans": [
        {
          "day": "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
          "meals": [
            { "meal": "breakfast|lunch|dinner|snack", "suggestion": "string", "why": "string" }
          ]
        }
      ],
      "sleepTarget": "string",
      "milestone": "string"
    }
  ]
}

REQUIREMENTS:
1. Return exactly 4 weeks (weekNumber 1-4).
2. Each week must include activityTarget, dietaryGuidance, sleepTarget, milestone, and exactly 7 dailyMealPlans (monday through sunday).
3. Each day must include breakfast, lunch, and dinner; snack is optional. Vary proteins and grains across days.
4. Keep meal suggestions concise (max 100 characters each).
5. Meal suggestions must respect dietary preference, country/culture, allergies, and medications.
6. Tie dietary and activity guidance to specific biomarker improvements where relevant.
7. Be specific and achievable (e.g. "Walk 20 minutes after dinner" not "exercise more").
8. Do not recommend foods that conflict with stated allergies.
9. Return one JSON object only. No markdown fences. No text before or after the JSON.`;
}

export async function generateFitnessPlan(userId: string) {
  const context = await buildFitnessPlanContext(userId);
  const prompt = buildPrompt(context);

  const aiPlan = await generateJson(
    env.GEMINI_FITNESS_MODEL,
    [],
    prompt,
    wellnessPlanAiSchema,
    "WellnessPlanAi with overview and exactly 4 weeks with 7 dailyMealPlans each",
    { maxOutputTokens: env.GEMINI_FITNESS_MAX_OUTPUT_TOKENS },
  );

  const planContent: WellnessPlanContent = {
    ...aiPlan,
    nutritionTargets: nutritionTargetsForPlan(context.nutritionTargets),
  };

  const stored = await storeWellnessPlan(
    userId,
    planContent,
    context.nutritionTargets,
  );

  return stored;
}

export { WellnessError };

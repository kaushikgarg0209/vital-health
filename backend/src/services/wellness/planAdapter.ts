import { env } from "../../config/env.js";
import { generateJson } from "../ai/geminiJson.js";
import {
  checkinAdaptationSchema,
  type SubmitCheckinInput,
} from "../../schemas/wellnessSchemas.js";
import type { WellnessPlan } from "../../types/wellness.js";
import {
  computeNutritionTargetsForUser,
  getWellnessPlanById,
  storeWeeklyCheckin,
  updatePlanNutritionTargets,
  WellnessError,
} from "./wellnessService.js";

export async function submitWeeklyCheckin(
  userId: string,
  planId: string,
  input: SubmitCheckinInput,
): Promise<{ checkin: Awaited<ReturnType<typeof storeWeeklyCheckin>>; plan: WellnessPlan }> {
  const plan = await getWellnessPlanById(userId, planId);
  const week = plan.plan.weeks.find((item) => item.weekNumber === input.weekNumber);

  if (!week) {
    throw new WellnessError("Invalid week number for this plan", 400, "VALIDATION_ERROR");
  }

  const prompt = `You are a wellness coach reviewing a weekly check-in.

CURRENT WEEK PLAN (week ${input.weekNumber}):
- Activity: ${week.activityTarget}
- Diet: ${week.dietaryGuidance}
- Sleep: ${week.sleepTarget}
- Milestone: ${week.milestone}

CHECK-IN:
- Adherence (1-5): ${input.adherenceScore}
- Energy (1-5): ${input.energyLevel}
- Weight: ${input.weightKg ?? "not recorded"} kg
- Sleep avg: ${input.sleepHoursAvg ?? "not recorded"} hours
- Notes: ${input.notes ?? "none"}

Respond with JSON:
{
  "feedback": "2-3 sentences of specific encouragement and what went well or needs attention",
  "adjustment": "One concrete adjustment for next week",
  "calorieDelta": 0
}

Use calorieDelta only if a small adjustment (+/- 100-200) is clinically reasonable based on adherence and weight trend. Otherwise 0.
Return one JSON object only. No markdown fences. No text before or after the JSON.`;

  const adaptation = await generateJson(
    env.GEMINI_FITNESS_MODEL,
    [],
    prompt,
    checkinAdaptationSchema,
    "CheckinAdaptation with feedback, adjustment, and calorieDelta",
  );

  const adjustedTargets = {
    adjustment: adaptation.adjustment,
    calorieDelta: adaptation.calorieDelta,
  };

  let updatedNutritionTargets = plan.nutritionTargets;
  let updatedPlan = plan.plan;

  if (input.weightKg !== undefined && adaptation.calorieDelta !== 0) {
    const recalculated = await computeNutritionTargetsForUser(userId);
    updatedNutritionTargets = {
      ...recalculated,
      dailyCalories: Math.max(1200, recalculated.dailyCalories + adaptation.calorieDelta),
    };
    updatedPlan = {
      ...plan.plan,
      nutritionTargets: {
        dailyCalories: updatedNutritionTargets.dailyCalories,
        proteinG: updatedNutritionTargets.proteinG,
        carbsG: updatedNutritionTargets.carbsG,
        fatG: updatedNutritionTargets.fatG,
        fiberG: updatedNutritionTargets.fiberG,
        rationale: updatedNutritionTargets.rationale,
      },
    };
    await updatePlanNutritionTargets(planId, updatedNutritionTargets, updatedPlan);
  }

  const checkin = await storeWeeklyCheckin(userId, planId, input.weekNumber, {
    weightKg: input.weightKg,
    adherenceScore: input.adherenceScore,
    energyLevel: input.energyLevel,
    sleepHoursAvg: input.sleepHoursAvg,
    notes: input.notes,
    aiFeedback: adaptation.feedback,
    adjustedTargets,
  });

  const refreshedPlan = await getWellnessPlanById(userId, planId);

  return { checkin, plan: refreshedPlan };
}

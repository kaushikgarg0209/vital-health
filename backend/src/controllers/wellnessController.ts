import type { Request, Response } from "express";
import type {
  AddWeightMeasurementInput,
  SubmitCheckinInput,
  UpdateWellnessPreferencesInput,
} from "../schemas/wellnessSchemas.js";
import { GeminiError } from "../services/ai/geminiJson.js";
import { GeminiRateLimitError } from "../services/ai/geminiRetry.js";
import { generateFitnessPlan } from "../services/wellness/fitnessPlanService.js";
import { submitWeeklyCheckin } from "../services/wellness/planAdapter.js";
import {
  addWeightMeasurement,
  computeNutritionTargetsForUser,
  getActiveWellnessPlan,
  getWellnessPlanById,
  getWellnessPreferences,
  getWellnessReadiness,
  listCheckinsForPlan,
  listWeightMeasurements,
  upsertWellnessPreferences,
  WellnessError,
} from "../services/wellness/wellnessService.js";
import { sendError, sendSuccess } from "../utils/responseHelpers.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function handleWellnessError(res: Response, error: unknown, context: string): void {
  if (error instanceof WellnessError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  if (error instanceof GeminiRateLimitError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  if (error instanceof GeminiError) {
    sendError(
      res,
      502,
      "We couldn't generate your plan right now. Please try again in a moment.",
      "PLAN_GENERATION_FAILED",
    );
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export async function getPreferencesHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getWellnessPreferences(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "Get wellness preferences");
  }
}

export async function updatePreferencesHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await upsertWellnessPreferences(
      req.user!.id,
      req.body as UpdateWellnessPreferencesInput,
    );
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "Update wellness preferences");
  }
}

export async function listWeightHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await listWeightMeasurements(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "List weight measurements");
  }
}

export async function addWeightHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await addWeightMeasurement(
      req.user!.id,
      req.body as AddWeightMeasurementInput,
    );
    sendSuccess(res, 201, data);
  } catch (error) {
    handleWellnessError(res, error, "Add weight measurement");
  }
}

export async function getTargetsHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await computeNutritionTargetsForUser(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "Get nutrition targets");
  }
}

export async function getReadinessHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getWellnessReadiness(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "Get wellness readiness");
  }
}

export async function generatePlanHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await generateFitnessPlan(req.user!.id);
    sendSuccess(res, 201, data);
  } catch (error) {
    handleWellnessError(res, error, "Generate wellness plan");
  }
}

export async function getActivePlanHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getActiveWellnessPlan(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "Get active wellness plan");
  }
}

export async function getPlanHandler(req: Request, res: Response): Promise<void> {
  try {
    const planId = getRouteParam(req.params.planId);
    const data = await getWellnessPlanById(req.user!.id, planId);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "Get wellness plan");
  }
}

export async function listCheckinsHandler(req: Request, res: Response): Promise<void> {
  try {
    const planId = getRouteParam(req.params.planId);
    await getWellnessPlanById(req.user!.id, planId);
    const data = await listCheckinsForPlan(planId);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleWellnessError(res, error, "List weekly check-ins");
  }
}

export async function submitCheckinHandler(req: Request, res: Response): Promise<void> {
  try {
    const planId = getRouteParam(req.params.planId);
    const result = await submitWeeklyCheckin(
      req.user!.id,
      planId,
      req.body as SubmitCheckinInput,
    );
    sendSuccess(res, 201, result);
  } catch (error) {
    handleWellnessError(res, error, "Submit weekly check-in");
  }
}

import type { Request, Response } from "express";
import { addTrendJob } from "../queues/producers.js";
import type { CreateManualReadingInput } from "../schemas/labSchemas.js";
import { generateInsight } from "../services/lab/insightService.js";
import {
  LabError,
  createManualReading,
  getBiomarkerDetail,
  listTrackedBiomarkers,
  listUnreadAlerts,
  markAlertRead,
} from "../services/lab/labService.js";
import { sendError, sendSuccess } from "../utils/responseHelpers.js";
import {
  GEMINI_RATE_LIMIT_MESSAGE,
  isGeminiRateLimitError,
} from "../services/ai/geminiRetry.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function handleLabError(res: Response, error: unknown, context: string): void {
  if (error instanceof LabError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  if (isGeminiRateLimitError(error)) {
    sendError(res, 429, GEMINI_RATE_LIMIT_MESSAGE, "RATE_LIMIT_EXCEEDED");
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export async function listBiomarkersHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await listTrackedBiomarkers(req.user!.id);
    sendSuccess(res, 200, data);
  } catch (error) {
    handleLabError(res, error, "List biomarkers");
  }
}

export async function getBiomarkerHandler(req: Request, res: Response): Promise<void> {
  try {
    const biomarkerKey = getRouteParam(req.params.key);
    const data = await getBiomarkerDetail(req.user!.id, biomarkerKey);

    if (data.readings.length === 0) {
      sendError(res, 404, "No readings found for this biomarker", "BIOMARKER_NOT_FOUND");
      return;
    }

    sendSuccess(res, 200, data);
  } catch (error) {
    handleLabError(res, error, "Get biomarker");
  }
}

export async function getBiomarkerInsightHandler(req: Request, res: Response): Promise<void> {
  try {
    const biomarkerKey = getRouteParam(req.params.key);
    const insight = await generateInsight(req.user!.id, biomarkerKey);
    sendSuccess(res, 200, insight);
  } catch (error) {
    handleLabError(res, error, "Get biomarker insight");
  }
}

export async function createManualReadingHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as CreateManualReadingInput;
    const reading = await createManualReading(req.user!.id, body);

    try {
      await addTrendJob({
        userId: req.user!.id,
        biomarkerKey: body.biomarkerKey,
      });
    } catch (queueError) {
      console.error("Failed to enqueue trend job after manual reading:", queueError);
    }

    sendSuccess(res, 201, reading);
  } catch (error) {
    handleLabError(res, error, "Create manual reading");
  }
}

export async function listAlertsHandler(req: Request, res: Response): Promise<void> {
  try {
    const alerts = await listUnreadAlerts(req.user!.id);
    sendSuccess(res, 200, alerts);
  } catch (error) {
    handleLabError(res, error, "List alerts");
  }
}

export async function markAlertReadHandler(req: Request, res: Response): Promise<void> {
  try {
    const alertId = getRouteParam(req.params.id);
    const alert = await markAlertRead(req.user!.id, alertId);
    sendSuccess(res, 200, alert);
  } catch (error) {
    handleLabError(res, error, "Mark alert read");
  }
}

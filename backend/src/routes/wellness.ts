import { Router } from "express";
import {
  addWeightHandler,
  generatePlanHandler,
  getActivePlanHandler,
  getPlanHandler,
  getPreferencesHandler,
  getReadinessHandler,
  getTargetsHandler,
  listCheckinsHandler,
  listWeightHandler,
  submitCheckinHandler,
  updatePreferencesHandler,
} from "../controllers/wellnessController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import {
  addWeightMeasurementSchema,
  planIdParamSchema,
  submitCheckinSchema,
  updateWellnessPreferencesSchema,
} from "../schemas/wellnessSchemas.js";

const router = Router();

router.get("/readiness", requireAuth, getReadinessHandler);
router.get("/preferences", requireAuth, getPreferencesHandler);
router.put(
  "/preferences",
  requireAuth,
  validateBody(updateWellnessPreferencesSchema),
  updatePreferencesHandler,
);

router.get("/weight", requireAuth, listWeightHandler);
router.post(
  "/weight",
  requireAuth,
  validateBody(addWeightMeasurementSchema),
  addWeightHandler,
);

router.get("/targets", requireAuth, getTargetsHandler);

router.post("/plans/generate", requireAuth, generatePlanHandler);
router.get("/plans/active", requireAuth, getActivePlanHandler);
router.get(
  "/plans/:planId",
  requireAuth,
  validateParams(planIdParamSchema),
  getPlanHandler,
);
router.get(
  "/plans/:planId/checkins",
  requireAuth,
  validateParams(planIdParamSchema),
  listCheckinsHandler,
);
router.post(
  "/plans/:planId/checkins",
  requireAuth,
  validateParams(planIdParamSchema),
  validateBody(submitCheckinSchema),
  submitCheckinHandler,
);

export default router;

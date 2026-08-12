import { Router } from "express";
import {
  createManualReadingHandler,
  getBiomarkerHandler,
  getBiomarkerInsightHandler,
  listAlertsHandler,
  listBiomarkersHandler,
  markAlertReadHandler,
} from "../controllers/labController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import {
  alertIdParamSchema,
  biomarkerKeyParamSchema,
  createManualReadingSchema,
} from "../schemas/labSchemas.js";

const router = Router();

router.get("/biomarkers", requireAuth, listBiomarkersHandler);

router.get(
  "/biomarkers/:key",
  requireAuth,
  validateParams(biomarkerKeyParamSchema),
  getBiomarkerHandler,
);

router.get(
  "/biomarkers/:key/insight",
  requireAuth,
  validateParams(biomarkerKeyParamSchema),
  getBiomarkerInsightHandler,
);

router.post(
  "/readings",
  requireAuth,
  validateBody(createManualReadingSchema),
  createManualReadingHandler,
);

router.get("/alerts", requireAuth, listAlertsHandler);

router.patch(
  "/alerts/:id/read",
  requireAuth,
  validateParams(alertIdParamSchema),
  markAlertReadHandler,
);

export default router;

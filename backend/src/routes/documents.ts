import { Router } from "express";
import {
  getDocument,
  listDocumentsHandler,
  patchDocument,
  removeDocument,
  searchDocumentsHandler,
  uploadDocument,
} from "../controllers/documentController.js";
import { requireAuth } from "../middleware/auth.js";
import {
  uploadSingleFile,
} from "../middleware/fileUpload.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  listDocumentsQuerySchema,
  searchDocumentsQuerySchema,
  updateDocumentSchema,
} from "../schemas/documentSchemas.js";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  uploadSingleFile,
  uploadDocument,
);

router.get(
  "/search",
  requireAuth,
  validateQuery(searchDocumentsQuerySchema),
  searchDocumentsHandler,
);

router.get(
  "/",
  requireAuth,
  validateQuery(listDocumentsQuerySchema),
  listDocumentsHandler,
);

router.get("/:id", requireAuth, getDocument);

router.patch(
  "/:id",
  requireAuth,
  validateBody(updateDocumentSchema),
  patchDocument,
);

router.delete("/:id", requireAuth, removeDocument);

export default router;

import { Router } from "express";
import {
  createSessionHandler,
  getSessionHandler,
  listSessionsHandler,
  streamMessageHandler,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createConversationSchema,
  listConversationsQuerySchema,
  sendMessageSchema,
} from "../schemas/chatSchemas.js";

const router = Router();

router.post(
  "/sessions",
  requireAuth,
  validateBody(createConversationSchema),
  createSessionHandler,
);

router.get(
  "/sessions",
  requireAuth,
  validateQuery(listConversationsQuerySchema),
  listSessionsHandler,
);

router.get("/sessions/:id", requireAuth, getSessionHandler);

router.post(
  "/sessions/:id/messages",
  requireAuth,
  validateBody(sendMessageSchema),
  streamMessageHandler,
);

export default router;

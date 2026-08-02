import { Router } from "express";
import authRouter from "./auth.js";
import chatRouter from "./chat.js";
import documentsRouter from "./documents.js";
import healthRouter from "./health.js";
import profileRouter from "./profile.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);
router.use("/profile", profileRouter);
router.use("/documents", documentsRouter);
router.use("/chat", chatRouter);

export default router;

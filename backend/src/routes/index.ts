import { Router } from "express";
import authRouter from "./auth.js";
import chatRouter from "./chat.js";
import documentsRouter from "./documents.js";
import familyRouter from "./family.js";
import healthRouter from "./health.js";
import labRouter from "./lab.js";
import profileRouter from "./profile.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);
router.use("/profile", profileRouter);
router.use("/documents", documentsRouter);
router.use("/chat", chatRouter);
router.use("/lab", labRouter);
router.use("/family", familyRouter);

export default router;

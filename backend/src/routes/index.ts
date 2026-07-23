import { Router } from "express";
import authRouter from "./auth.js";
import documentsRouter from "./documents.js";
import healthRouter from "./health.js";
import profileRouter from "./profile.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);
router.use("/profile", profileRouter);
router.use("/documents", documentsRouter);

export default router;

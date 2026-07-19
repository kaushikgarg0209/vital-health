import { Router } from "express";
import authRouter from "./auth.js";
import healthRouter from "./health.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);

export default router;

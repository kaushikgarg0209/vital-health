import type { Request, Response } from "express";
import { getHealthStatus } from "../services/healthService.js";

export async function getHealth(_req: Request, res: Response) {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;

  res.status(statusCode).json(health);
}

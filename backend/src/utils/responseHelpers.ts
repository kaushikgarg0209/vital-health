import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  status: number,
  data: T,
): void {
  res.status(status).json({ data });
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  code: string,
): void {
  res.status(status).json({
    error: {
      message,
      code,
    },
  });
}

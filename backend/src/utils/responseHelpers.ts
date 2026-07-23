import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  status: number,
  data: T,
): void {
  res.status(status).json({ data });
}

export function sendPaginatedSuccess<T>(
  res: Response,
  status: number,
  data: T[],
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  },
): void {
  res.status(status).json({ data, meta });
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

import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { sendError } from "../utils/responseHelpers.js";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed";
      sendError(res, 400, message, "VALIDATION_ERROR");
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed";
      sendError(res, 400, message, "VALIDATION_ERROR");
      return;
    }

    req.validatedQuery = parsed.data;
    next();
  };
}

import type { Request, Response } from "express";
import type { RegisterInput } from "../schemas/authSchemas.js";
import { AuthError, registerUser } from "../services/authService.js";
import { sendError, sendSuccess } from "../utils/responseHelpers.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await registerUser(req.body as RegisterInput);

    sendSuccess(res, 201, result);
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error.statusCode, error.message, error.code);
      return;
    }

    console.error("Register error:", error);
    sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
  }
}

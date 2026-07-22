import type { Request, Response } from "express";
import type { LoginInput, RegisterInput } from "../schemas/authSchemas.js";
import { AuthError, loginUser, registerUser } from "../services/authService.js";
import {
  getProfileByUserId,
} from "../services/profileService.js";
import { toProfileSessionSummary } from "../types/profile.js";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies.js";
import { sendError, sendSuccess } from "../utils/responseHelpers.js";
function handleAuthError(res: Response, error: unknown, context: string): void {
  if (error instanceof AuthError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await registerUser(req.body as RegisterInput);
    sendSuccess(res, 201, result);
  } catch (error) {
    handleAuthError(res, error, "Register");
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { user, session } = await loginUser(req.body as LoginInput);

    setAuthCookies(res, session);
    sendSuccess(res, 200, { user });
  } catch (error) {
    handleAuthError(res, error, "Login");
  }
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookies(res);
  sendSuccess(res, 200, { message: "Logged out" });
}

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const profile = await getProfileByUserId(req.user!.id);

    sendSuccess(res, 200, {
      user: req.user,
      profile: profile ? toProfileSessionSummary(profile) : null,
    });
  } catch (error) {
    handleAuthError(res, error, "Session");
  }
}

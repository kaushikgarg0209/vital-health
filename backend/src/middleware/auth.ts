import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { refreshUserSession } from "../services/authService.js";
import type { AuthUser } from "../types/auth.js";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies.js";
import { extractAccessToken, extractRefreshToken } from "../utils/authToken.js";
import { sendError } from "../utils/responseHelpers.js";

async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const accessToken = extractAccessToken(req);

  if (accessToken) {
    const user = await verifyAccessToken(accessToken);
    if (user) {
      req.user = user;
      next();
      return;
    }
  }

  const refreshToken = extractRefreshToken(req);

  if (refreshToken) {
    const refreshed = await refreshUserSession(refreshToken);

    if (refreshed) {
      setAuthCookies(res, refreshed.session);
      req.user = refreshed.user;
      next();
      return;
    }
  }

  clearAuthCookies(res);

  if (!accessToken && !refreshToken) {
    sendError(res, 401, "Missing authorization token", "UNAUTHORIZED");
    return;
  }

  sendError(res, 401, "Invalid or expired token", "UNAUTHORIZED");
}

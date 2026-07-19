import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import type { AuthUser } from "../types/auth.js";

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function sendUnauthorized(res: Response, message: string) {
  res.status(401).json({
    error: {
      message,
      code: "UNAUTHORIZED",
    },
  });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    sendUnauthorized(res, "Missing authorization token");
    return;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    sendUnauthorized(res, "Invalid or expired token");
    return;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email ?? "",
  };

  req.user = authUser;
  next();
}

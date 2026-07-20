import type { Response } from "express";
import type { Session } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const ACCESS_TOKEN_COOKIE = "vital_access_token";
export const REFRESH_TOKEN_COOKIE = "vital_refresh_token";

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(res: Response, session: Session): void {
  res.cookie(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...baseCookieOptions,
    maxAge: session.expires_in * 1000,
  });

  if (session.refresh_token) {
    res.cookie(REFRESH_TOKEN_COOKIE, session.refresh_token, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
    });
  }
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
}

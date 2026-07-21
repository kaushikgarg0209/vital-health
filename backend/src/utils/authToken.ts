import type { Request } from "express";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./authCookies.js";

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export function extractAccessToken(req: Request): string | null {
  const bearerToken = extractBearerToken(req.headers.authorization);
  if (bearerToken) {
    return bearerToken;
  }

  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}

export function extractRefreshToken(req: Request): string | null {
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}

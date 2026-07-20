import type { Session } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { supabaseAuth } from "../config/supabaseAuth.js";
import type { LoginInput, RegisterInput } from "../schemas/authSchemas.js";
import type { AuthUser } from "../types/auth.js";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function mapSignUpError(message: string): { statusCode: number; code: string } {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return { statusCode: 409, code: "EMAIL_ALREADY_REGISTERED" };
  }

  if (normalized.includes("password")) {
    return { statusCode: 400, code: "INVALID_PASSWORD" };
  }

  return { statusCode: 400, code: "REGISTRATION_FAILED" };
}

function mapSignInError(message: string): { statusCode: number; code: string } {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return { statusCode: 401, code: "EMAIL_NOT_CONFIRMED" };
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return { statusCode: 401, code: "INVALID_CREDENTIALS" };
  }

  return { statusCode: 401, code: "LOGIN_FAILED" };
}

export async function registerUser(input: RegisterInput): Promise<{ userId: string }> {
  const { data, error } = await supabaseAuth.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${env.FRONTEND_URL}/confirm?callback=1`,
      data: {
        full_name: input.full_name,
      },
    },
  });

  if (error) {
    const mapped = mapSignUpError(error.message);
    throw new AuthError(error.message, mapped.statusCode, mapped.code);
  }

  if (!data.user) {
    throw new AuthError("Registration failed", 500, "REGISTRATION_FAILED");
  }

  return { userId: data.user.id };
}

export async function loginUser(
  input: LoginInput,
): Promise<{ user: AuthUser; session: Session }> {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    const mapped = mapSignInError(error.message);
    throw new AuthError(error.message, mapped.statusCode, mapped.code);
  }

  if (!data.session || !data.user) {
    throw new AuthError("Login failed", 401, "LOGIN_FAILED");
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
    },
    session: data.session,
  };
}

export async function refreshUserSession(
  refreshToken: string,
): Promise<{ user: AuthUser; session: Session } | null> {
  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    return null;
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
    },
    session: data.session,
  };
}

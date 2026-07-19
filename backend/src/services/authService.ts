import { supabaseAuth } from "../config/supabaseAuth.js";
import type { RegisterInput } from "../schemas/authSchemas.js";

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

export async function registerUser(input: RegisterInput): Promise<{ userId: string }> {
  const { data, error } = await supabaseAuth.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
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

import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ConfirmEmailResult =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "idle" };

export async function confirmEmailFromToken(
  tokenHash: string,
  type: string,
): Promise<ConfirmEmailResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  await supabase.auth.signOut();

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success" };
}

export function resolveConfirmStateFromParams(
  params: Record<string, string | string[] | undefined>,
): ConfirmEmailResult | "pending" {
  const tokenHash = paramValue(params.token_hash);
  const type = paramValue(params.type);
  const callback = paramValue(params.callback);

  const errorDescription =
    paramValue(params.error_description) ?? paramValue(params.error);

  if (errorDescription) {
    return {
      status: "error",
      message: decodeURIComponent(errorDescription.replace(/\+/g, " ")),
    };
  }

  if (tokenHash && type) {
    return "pending";
  }

  if (callback === "1") {
    return { status: "success" };
  }

  return { status: "idle" };
}

function paramValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

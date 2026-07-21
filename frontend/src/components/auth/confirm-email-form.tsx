"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import type { ConfirmEmailResult } from "@/lib/auth/confirm-email";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthFormPanel } from "@/components/auth/auth-form-panel";
import { buttonVariants } from "@/components/ui/button";

type ConfirmState =
  | { status: "verifying" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "idle" };

type ConfirmEmailFormProps = {
  initialState?: ConfirmEmailResult;
};

function readHashParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function readQueryParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function hasClientCallbackParams(): boolean {
  const hash = readHashParams();
  const query = readQueryParams();

  return (
    hash.size > 0 ||
    query.has("code") ||
    query.has("token_hash") ||
    query.get("callback") === "1" ||
    query.has("error") ||
    query.has("error_description")
  );
}

function clearRedirectParams(): void {
  if (window.location.hash || window.location.search) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

async function resolveClientConfirmation(): Promise<ConfirmState> {
  const hash = readHashParams();
  const query = readQueryParams();

  const errorDescription =
    hash.get("error_description") ??
    query.get("error_description") ??
    hash.get("error") ??
    query.get("error");

  if (errorDescription) {
    return {
      status: "error",
      message: decodeURIComponent(errorDescription.replace(/\+/g, " ")),
    };
  }

  const code = query.get("code");
  if (code) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    await supabase.auth.signOut();

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success" };
  }

  const tokenHash = query.get("token_hash");
  const type = query.get("type");

  if (tokenHash && type) {
    const supabase = getSupabaseBrowserClient();
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

  if (
    hash.has("access_token") ||
    hash.get("type") === "signup" ||
    hash.get("type") === "email" ||
    hash.size > 0 ||
    query.get("callback") === "1"
  ) {
    return { status: "success" };
  }

  return { status: "idle" };
}

function toConfirmState(initialState?: ConfirmEmailResult): ConfirmState {
  if (!initialState || initialState.status === "idle") {
    return { status: "idle" };
  }

  return initialState;
}

export function ConfirmEmailForm({ initialState }: ConfirmEmailFormProps) {
  const [state, setState] = useState<ConfirmState>(() => toConfirmState(initialState));

  useEffect(() => {
    if (initialState && initialState.status !== "idle") {
      clearRedirectParams();
      return;
    }

    if (!hasClientCallbackParams()) {
      return;
    }

    let cancelled = false;

    async function run() {
      setState({ status: "verifying" });

      try {
        const resolved = await resolveClientConfirmation();

        if (cancelled) {
          return;
        }

        setState(resolved);
        clearRedirectParams();
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not verify your email. Please try again.",
        });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [initialState]);

  if (state.status === "verifying") {
    return (
      <AuthFormPanel
        title="Verifying your email"
        description="Please wait while we confirm your email address."
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <p className="text-sm text-neutral-500">This usually takes just a moment.</p>
        </div>
      </AuthFormPanel>
    );
  }

  if (state.status === "error") {
    return (
      <AuthFormPanel
        title="Confirmation failed"
        description="We couldn't verify your email address."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <p className="text-sm leading-relaxed text-red-700">{state.message}</p>
          </div>
          <div className="space-y-3">
            <Link
              href="/register"
              className={buttonVariants({
                size: "lg",
                className: "h-11 w-full bg-primary-600 hover:bg-primary-700",
              })}
            >
              Create a new account
            </Link>
            <Link
              href="/login"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-11 w-full",
              })}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthFormPanel>
    );
  }

  if (state.status === "success") {
    return (
      <AuthFormPanel
        title="Email confirmed"
        description="Your email address has been verified. You're ready to sign in."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-relaxed text-emerald-800">
              Your account is verified. Sign in to start using Vital.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/login"
              className={buttonVariants({
                size: "lg",
                className: "h-11 w-full bg-primary-600 hover:bg-primary-700",
              })}
            >
              Sign in
            </Link>
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-11 w-full",
              })}
            >
              Go to site
            </Link>
          </div>
        </div>
      </AuthFormPanel>
    );
  }

  return (
    <AuthFormPanel
      title="Confirm your email"
      description="We sent a confirmation link to your inbox. Open it to verify your address."
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4">
          <Mail className="mt-0.5 size-5 shrink-0 text-primary-600" />
          <p className="text-sm leading-relaxed text-neutral-600">
            After confirming, you&apos;ll be redirected here automatically. You can
            also sign in once verification is complete.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/login"
            className={buttonVariants({
              size: "lg",
              className: "h-11 w-full bg-primary-600 hover:bg-primary-700",
            })}
          >
            Already confirmed? Sign in
          </Link>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "h-11 w-full",
            })}
          >
            Go to site
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "ghost", className: "h-11 w-full" })}
          >
            Back to registration
          </Link>
        </div>
      </div>
    </AuthFormPanel>
  );
}

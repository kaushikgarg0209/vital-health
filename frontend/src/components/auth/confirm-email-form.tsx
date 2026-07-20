"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Activity, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { ConfirmEmailResult } from "@/lib/auth/confirm-email";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card className="border-neutral-100 shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-semibold text-neutral-700">
            Verifying your email
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Please wait while we confirm your address...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="border-neutral-100 shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <XCircle className="size-5" />
          </div>
          <CardTitle className="text-2xl font-semibold text-neutral-700">
            Confirmation failed
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {state.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/register"
            className={buttonVariants({
              className: "w-full bg-primary-600 text-white hover:bg-primary-700",
            })}
          >
            Create a new account
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "success") {
    return (
      <Card className="border-neutral-100 shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <CardTitle className="text-2xl font-semibold text-neutral-700">
            Email confirmed
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Your email address has been verified. You can now sign in to Vital.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/login"
            className={buttonVariants({
              className: "w-full bg-primary-600 text-white hover:bg-primary-700",
            })}
          >
            Sign in
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Go to site
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neutral-100 shadow-none">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Activity className="size-5" />
        </div>
        <CardTitle className="text-2xl font-semibold text-neutral-700">
          Confirm your email
        </CardTitle>
        <CardDescription className="text-neutral-400">
          We sent a confirmation link to your inbox. Open that link to verify
          your address — you will be brought back here once it succeeds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link
          href="/login"
          className={buttonVariants({
            className: "w-full bg-primary-600 text-white hover:bg-primary-700",
          })}
        >
          Already confirmed? Sign in
        </Link>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          Go to site
        </Link>
        <Link
          href="/register"
          className={buttonVariants({ variant: "ghost", className: "w-full" })}
        >
          Back to registration
        </Link>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { loginSchema } from "@/lib/validation/auth";
import { AuthFormPanel } from "@/components/auth/auth-form-panel";
import { PasswordField, useValidatedForm, ValidatedField } from "@/components/auth/validated-field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    values,
    visibleErrors,
    isValid,
    setField,
    markTouched,
    markSubmitAttempted,
  } = useValidatedForm(loginSchema, {
    email: "",
    password: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markSubmitAttempted();
    setError(null);

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(parsed.data);
      const nextPath = searchParams.get("next") ?? "/dashboard";
      window.location.assign(nextPath);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFormPanel
      title="Welcome back"
      description="Sign in to access your health records, biomarker trends, and AI advocate."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <ValidatedField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          error={visibleErrors.email}
          onValueChange={(value) => setField("email", value)}
          onBlur={() => markTouched("email")}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={values.password}
          error={visibleErrors.password}
          onValueChange={(value) => setField("password", value)}
          onBlur={() => markTouched("password")}
        />
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-primary-600 text-base shadow-sm shadow-primary-600/20 hover:bg-primary-700"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Create one free
          </Link>
        </p>
      </form>
    </AuthFormPanel>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Activity } from "lucide-react";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { loginSchema } from "@/lib/validation/auth";
import { PasswordField, useValidatedForm, ValidatedField } from "@/components/auth/validated-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="border-neutral-100 shadow-none">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Activity className="size-5" />
        </div>
        <CardTitle className="text-2xl font-semibold text-neutral-700">
          Sign in to Vital
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Access your health records and AI advocate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <ValidatedField
            id="email"
            label="Email"
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
            className="w-full bg-primary-600 hover:bg-primary-700"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-neutral-400">
            No account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity } from "lucide-react";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { registerFormSchema, toRegisterInput } from "@/lib/validation/auth";
import { PasswordField, useValidatedForm, ValidatedField } from "@/components/auth/validated-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    values,
    visibleErrors,
    isValid,
    setField,
    markTouched,
    markSubmitAttempted,
  } = useValidatedForm(registerFormSchema, {
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markSubmitAttempted();
    setError(null);
    setSuccessMessage(null);

    const parsed = registerFormSchema.safeParse(values);

    if (!parsed.success) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(toRegisterInput(parsed.data));

      setSuccessMessage(
        "Account created. Check your email to confirm your address, then sign in.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <Card className="border-neutral-100 shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-neutral-700">
            Check your email
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {successMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-primary-600 hover:bg-primary-700"
            onClick={() => router.push("/login")}
          >
            Go to sign in
          </Button>
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
          Create your Vital account
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Start organizing your health in one place.
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
            id="name"
            label="Full name"
            autoComplete="name"
            placeholder="Jane Doe"
            value={values.full_name}
            error={visibleErrors.full_name}
            onValueChange={(value) => setField("full_name", value)}
            onBlur={() => markTouched("full_name")}
          />
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
            autoComplete="new-password"
            value={values.password}
            error={visibleErrors.password}
            onValueChange={(value) => setField("password", value)}
            onBlur={() => markTouched("password")}
          />
          <PasswordField
            id="confirm_password"
            label="Confirm password"
            autoComplete="new-password"
            value={values.confirm_password}
            error={visibleErrors.confirm_password}
            onValueChange={(value) => setField("confirm_password", value)}
            onBlur={() => markTouched("confirm_password")}
          />
          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

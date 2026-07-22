"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { registerFormSchema, toRegisterInput } from "@/lib/validation/auth";
import { AuthFormPanel } from "@/components/auth/auth-form-panel";
import { PasswordField, useValidatedForm, ValidatedField } from "@/components/auth/validated-field";
import { Button } from "@/components/ui/button";

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
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      <AuthFormPanel
        title="Check your email"
        description="We sent a confirmation link to your inbox. Click it to verify your account, then sign in."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-relaxed text-emerald-800">{successMessage}</p>
          </div>
          <Button
            size="lg"
            className="h-11 w-full bg-primary-600 text-base hover:bg-primary-700"
            onClick={() => router.push("/login")}
          >
            Go to sign in
          </Button>
        </div>
      </AuthFormPanel>
    );
  }

  return (
    <AuthFormPanel
      title="Create your account"
      description="Start building your personal health profile. Free to get started."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <ValidatedField
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={values.fullName}
          error={visibleErrors.fullName}
          onValueChange={(value) => setField("fullName", value)}
          onBlur={() => markTouched("fullName")}
        />
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
          autoComplete="new-password"
          value={values.password}
          error={visibleErrors.password}
          onValueChange={(value) => setField("password", value)}
          onBlur={() => markTouched("password")}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirmPassword}
          error={visibleErrors.confirmPassword}
          onValueChange={(value) => setField("confirmPassword", value)}
          onBlur={() => markTouched("confirmPassword")}
        />
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-primary-600 text-base shadow-sm shadow-primary-600/20 hover:bg-primary-700"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormPanel>
  );
}

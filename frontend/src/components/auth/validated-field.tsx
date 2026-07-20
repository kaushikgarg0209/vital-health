"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ValidatedFieldProps = {
  id: string;
  label: string;
  type?: React.ComponentProps<"input">["type"];
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onValueChange: (value: string) => void;
  onBlur: () => void;
};

export function ValidatedField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  value,
  error,
  onValueChange,
  onBlur,
}: ValidatedFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={cn(error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20")}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

type PasswordFieldProps = Omit<ValidatedFieldProps, "type">;

export function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  error,
  onValueChange,
  onBlur,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          className={cn(
            "pr-10",
            error &&
              "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 z-10 flex items-center px-3 text-neutral-400 hover:text-neutral-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function useValidatedForm<TValues extends Record<string, unknown>>(
  schema: z.ZodType<TValues>,
  initialValues: TValues,
) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof TValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const allFieldErrors = useMemo(() => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {} as Partial<Record<keyof TValues, string>>;
    }

    const errors = {} as Partial<Record<keyof TValues, string>>;

    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof TValues | undefined;

      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }

    return errors;
  }, [schema, values]);

  const visibleErrors = useMemo(() => {
    const errors: Partial<Record<keyof TValues, string>> = {};

    for (const [field, message] of Object.entries(allFieldErrors)) {
      const key = field as keyof TValues;
      const hasValue = String(values[key] ?? "").length > 0;

      if (submitAttempted || touched[key] || hasValue) {
        errors[key] = message as string;
      }
    }

    return errors;
  }, [allFieldErrors, submitAttempted, touched, values]);

  const isValid = useMemo(() => schema.safeParse(values).success, [schema, values]);

  function setField<K extends keyof TValues>(field: K, value: TValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function markTouched(field: keyof TValues) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function markSubmitAttempted() {
    setSubmitAttempted(true);
  }

  return {
    values,
    visibleErrors,
    isValid,
    setField,
    markTouched,
    markSubmitAttempted,
  };
}

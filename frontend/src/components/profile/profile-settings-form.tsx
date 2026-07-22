"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useValidatedForm, ValidatedField } from "@/components/auth/validated-field";
import { ProfileSection } from "@/components/profile/profile-section";
import { SexOptionGroup } from "@/components/profile/sex-option-group";
import { TagListInput } from "@/components/profile/tag-list-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { profileFormSchema } from "@/lib/validation/profile";
import {
  formValuesToUpdateInput,
  type ProfileFormValues,
} from "@/types/profile";

const CONDITION_SUGGESTIONS = [
  "Type 2 Diabetes",
  "Hypertension",
  "Asthma",
  "Hypothyroidism",
];

const ALLERGY_SUGGESTIONS = ["Penicillin", "Peanuts", "Shellfish", "Latex"];

const MEDICATION_SUGGESTIONS = [
  "Metformin",
  "Levothyroxine",
  "Atorvastatin",
  "Lisinopril",
];

type ProfileSettingsFormProps = {
  initialValues: ProfileFormValues;
};

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
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
  } = useValidatedForm(profileFormSchema, initialValues);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markSubmitAttempted();
    setError(null);
    setSuccessMessage(null);

    const parsed = profileFormSchema.safeParse(values);

    if (!parsed.success) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile(formValuesToUpdateInput(values));
      setSuccessMessage("Profile saved successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800">{successMessage}</p>
        </div>
      ) : null}

      <Card className="border-neutral-100 shadow-sm shadow-neutral-900/5">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-lg font-semibold text-neutral-800">
            Personal information
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Core details used across your Vital experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <ProfileSection title="Identity">
            <ValidatedField
              id="fullName"
              label="Full name"
              autoComplete="name"
              placeholder="Jane Doe"
              value={values.fullName}
              error={visibleErrors.fullName}
              onValueChange={(value) => setField("fullName", value)}
              onBlur={() => markTouched("fullName")}
            />
            <ValidatedField
              id="dateOfBirth"
              label="Date of birth"
              type="date"
              value={values.dateOfBirth}
              error={visibleErrors.dateOfBirth}
              onValueChange={(value) => setField("dateOfBirth", value)}
              onBlur={() => markTouched("dateOfBirth")}
            />
            <SexOptionGroup
              value={values.biologicalSex}
              error={visibleErrors.biologicalSex}
              onChange={(value) => setField("biologicalSex", value)}
              onBlur={() => markTouched("biologicalSex")}
            />
          </ProfileSection>
        </CardContent>
      </Card>

      <Card className="border-neutral-100 shadow-sm shadow-neutral-900/5">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-lg font-semibold text-neutral-800">
            Measurements
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Optional metrics that improve trend analysis and context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <ValidatedField
              id="heightCm"
              label="Height (cm)"
              type="number"
              placeholder="162"
              value={values.heightCm}
              error={visibleErrors.heightCm}
              onValueChange={(value) => setField("heightCm", value)}
              onBlur={() => markTouched("heightCm")}
            />
            <ValidatedField
              id="weightKg"
              label="Weight (kg)"
              type="number"
              placeholder="58.5"
              value={values.weightKg}
              error={visibleErrors.weightKg}
              onValueChange={(value) => setField("weightKg", value)}
              onBlur={() => markTouched("weightKg")}
            />
          </div>
          <ValidatedField
            id="bloodType"
            label="Blood type"
            placeholder="B+"
            value={values.bloodType}
            error={visibleErrors.bloodType}
            onValueChange={(value) => setField("bloodType", value)}
            onBlur={() => markTouched("bloodType")}
          />
        </CardContent>
      </Card>

      <Card className="border-neutral-100 shadow-sm shadow-neutral-900/5">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-lg font-semibold text-neutral-800">
            Health background
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Helps Vital and your AI advocate stay aware of your medical context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <TagListInput
            id="knownConditions"
            label="Known conditions"
            values={values.knownConditions}
            onChange={(next) => setField("knownConditions", next)}
            suggestions={CONDITION_SUGGESTIONS}
          />
          <TagListInput
            id="allergies"
            label="Allergies"
            values={values.allergies}
            onChange={(next) => setField("allergies", next)}
            suggestions={ALLERGY_SUGGESTIONS}
          />
          <TagListInput
            id="currentMedications"
            label="Current medications"
            values={values.currentMedications}
            onChange={(next) => setField("currentMedications", next)}
            suggestions={MEDICATION_SUGGESTIONS}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-xl bg-primary-600 px-8 shadow-sm shadow-primary-600/20 hover:bg-primary-700"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

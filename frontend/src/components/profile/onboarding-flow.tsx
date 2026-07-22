"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, HeartPulse, Ruler, UserRound } from "lucide-react";
import { useValidatedForm, ValidatedField } from "@/components/auth/validated-field";
import { OnboardingProgress } from "@/components/profile/onboarding-progress";
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
import {
  profileFormSchema,
  profileStep1Schema,
  profileStep2Schema,
} from "@/lib/validation/profile";
import {
  formValuesToUpdateInput,
  type ProfileFormValues,
} from "@/types/profile";

const STEPS = [
  { id: "about", label: "About you" },
  { id: "measurements", label: "Measurements" },
  { id: "history", label: "Health history" },
];

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

type OnboardingFlowProps = {
  initialValues: ProfileFormValues;
};

export function OnboardingFlow({ initialValues }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    values,
    visibleErrors,
    isValid,
    setField,
    markTouched,
    markSubmitAttempted,
  } = useValidatedForm(profileFormSchema, initialValues);

  const step1Valid = profileStep1Schema.safeParse(values).success;
  const step2Valid = profileStep2Schema.safeParse(values).success;

  async function saveProfile(nextPath: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfile(formValuesToUpdateInput(values));
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleContinue() {
    markSubmitAttempted();

    if (step === 0) {
      if (!profileStep1Schema.safeParse(values).success) {
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await updateProfile({
          fullName: values.fullName.trim(),
          dateOfBirth: values.dateOfBirth,
          biologicalSex: values.biologicalSex || null,
        });
        setStep(1);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (step === 1) {
      if (!profileStep2Schema.safeParse(values).success) {
        return;
      }

      setStep(2);
      return;
    }

    if (!isValid) {
      return;
    }

    await saveProfile("/dashboard");
  }

  async function handleSkip() {
    if (step === 0) {
      return;
    }

    if (step === 1) {
      if (step1Valid) {
        await saveProfile("/dashboard");
      }

      return;
    }

    if (step1Valid) {
      await saveProfile("/dashboard");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
          Profile setup
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-800">
          Let&apos;s personalize your health profile
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-500">
          Vital uses this information to interpret your records, personalize insights,
          and keep your AI advocate grounded in your real health context.
        </p>
      </div>

      <OnboardingProgress steps={STEPS} currentStep={step} />

      <Card className="border-neutral-100 shadow-sm shadow-neutral-900/5">
        <CardHeader className="border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              {step === 0 ? (
                <UserRound className="size-5" />
              ) : step === 1 ? (
                <Ruler className="size-5" />
              ) : (
                <HeartPulse className="size-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {step === 0
                  ? "Tell us about yourself"
                  : step === 1
                    ? "Add your measurements"
                    : "Share your health background"}
              </CardTitle>
              <CardDescription className="mt-1 text-neutral-400">
                {step === 0
                  ? "These basics help Vital tailor lab ranges and recommendations."
                  : step === 1
                    ? "Optional, but useful for trends, BMI context, and future insights."
                    : "Optional details that help your AI advocate understand your history."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {step === 0 ? (
            <ProfileSection
              title="Personal details"
              description="Required to complete your profile setup."
            >
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
          ) : null}

          {step === 1 ? (
            <ProfileSection
              title="Body metrics"
              description="You can update these anytime from settings."
            >
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
                label="Blood type (optional)"
                placeholder="B+"
                value={values.bloodType}
                error={visibleErrors.bloodType}
                onValueChange={(value) => setField("bloodType", value)}
                onBlur={() => markTouched("bloodType")}
              />
            </ProfileSection>
          ) : null}

          {step === 2 ? (
            <div className="space-y-8">
              <TagListInput
                id="knownConditions"
                label="Known conditions"
                description="Chronic or ongoing diagnoses Vital should keep in mind."
                placeholder="e.g. Type 2 Diabetes"
                values={values.knownConditions}
                onChange={(next) => setField("knownConditions", next)}
                suggestions={CONDITION_SUGGESTIONS}
              />
              <TagListInput
                id="allergies"
                label="Allergies"
                description="Medication, food, or environmental allergies."
                placeholder="e.g. Penicillin"
                values={values.allergies}
                onChange={(next) => setField("allergies", next)}
                suggestions={ALLERGY_SUGGESTIONS}
              />
              <TagListInput
                id="currentMedications"
                label="Current medications"
                description="Include dose if you know it — helpful for interaction checks later."
                placeholder="e.g. Metformin 500mg"
                values={values.currentMedications}
                onChange={(next) => setField("currentMedications", next)}
                suggestions={MEDICATION_SUGGESTIONS}
              />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-neutral-200"
                  onClick={() => setStep((current) => current - 1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              ) : null}
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl text-neutral-500"
                  onClick={handleSkip}
                  disabled={isSubmitting || !step1Valid}
                >
                  Skip for now
                </Button>
              ) : null}
            </div>

            <Button
              type="button"
              size="lg"
              className="h-11 rounded-xl bg-primary-600 px-6 shadow-sm shadow-primary-600/20 hover:bg-primary-700"
              disabled={
                isSubmitting ||
                (step === 0 && !step1Valid) ||
                (step === 1 && !step2Valid) ||
                (step === 2 && !isValid)
              }
              onClick={handleContinue}
            >
              {isSubmitting
                ? "Saving..."
                : step === 2
                  ? "Complete setup"
                  : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <p className="text-sm leading-relaxed text-emerald-800">
          Your profile stays private to your account. Vital never shares this data without
          your explicit action.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { CountrySelect } from "@/components/fitness/CountrySelect";
import { FormSelect } from "@/components/fitness/FormSelect";
import { OnboardingProgress } from "@/components/profile/onboarding-progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isWellnessApiError, toUserFacingWellnessError } from "@/lib/api/wellness";
import { ISO_COUNTRY_CODES } from "@/lib/constants/countries";
import { useUpdateWellnessPreferences, useWellnessPreferences } from "@/hooks/useWellness";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LEVEL_LABELS,
  DIETARY_PREFERENCE_LABELS,
  FITNESS_GOAL_LABELS,
  READINESS_LABELS,
  WORK_ROUTINE_LABELS,
  type ActivityLevel,
  type DietaryPreference,
  type FitnessGoal,
  type WellnessPreferences,
  type WorkRoutine,
} from "@/types/wellness";

type WellnessSetupWizardProps = {
  onComplete: (result?: { preferencesUpdatedWithActivePlan?: boolean }) => void;
  hasActivePlan?: boolean;
};

const STEPS = [
  { id: "diet", label: "Diet & region" },
  { id: "activity", label: "Activity & work" },
  { id: "goals", label: "Goals" },
];

function preferencesToFormState(preferences: WellnessPreferences | null | undefined) {
  return {
    dietaryPreference: preferences?.dietaryPreference ?? "vegetarian",
    countryCode: preferences?.countryCode ?? "IN",
    cuisineNotes: preferences?.cuisineNotes ?? "",
    activityLevel: preferences?.activityLevel ?? "moderately_active",
    workRoutine: preferences?.workRoutine ?? "desk_job",
    fitnessGoal: preferences?.fitnessGoal ?? "improve_biomarkers",
    targetWeightKg: preferences?.targetWeightKg?.toString() ?? "",
    typicalSleepHours: preferences?.typicalSleepHours?.toString() ?? "7",
  };
}

export function WellnessSetupWizard({
  onComplete,
  hasActivePlan = false,
}: WellnessSetupWizardProps) {
  const { data: existingPreferences } = useWellnessPreferences();
  const mutation = useUpdateWellnessPreferences();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("vegetarian");
  const [countryCode, setCountryCode] = useState("IN");
  const [cuisineNotes, setCuisineNotes] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately_active");
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine>("desk_job");
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>("improve_biomarkers");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [typicalSleepHours, setTypicalSleepHours] = useState("7");

  useEffect(() => {
    if (!existingPreferences) {
      return;
    }

    const state = preferencesToFormState(existingPreferences);
    setDietaryPreference(state.dietaryPreference as DietaryPreference);
    setCountryCode(state.countryCode);
    setCuisineNotes(state.cuisineNotes);
    setActivityLevel(state.activityLevel as ActivityLevel);
    setWorkRoutine(state.workRoutine as WorkRoutine);
    setFitnessGoal(state.fitnessGoal as FitnessGoal);
    setTargetWeightKg(state.targetWeightKg);
    setTypicalSleepHours(state.typicalSleepHours);
  }, [existingPreferences]);

  function validateStep(currentStep: number): Record<string, string> {
    const errors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!ISO_COUNTRY_CODES.has(countryCode)) {
        errors.countryCode = "Select a valid country from the list.";
      }
    }

    if (currentStep === 1 && typicalSleepHours) {
      const sleep = Number(typicalSleepHours);
      if (!Number.isFinite(sleep) || sleep < 3 || sleep > 14) {
        errors.typicalSleepHours = "Sleep hours must be between 3 and 14.";
      }
    }

    if (currentStep === 2 && targetWeightKg) {
      const weight = Number(targetWeightKg);
      if (!Number.isFinite(weight) || weight < 20 || weight > 500) {
        errors.targetWeightKg = "Target weight must be between 20 and 500 kg.";
      }
    }

    return errors;
  }

  function handleContinue() {
    const errors = validateStep(step);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setError(null);
    setStep((current) => current + 1);
  }

  async function handleSubmit() {
    const errors = validateStep(2);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setError(null);

    try {
      await mutation.mutateAsync({
        dietaryPreference,
        countryCode: countryCode.toUpperCase(),
        cuisineNotes: cuisineNotes.trim() || null,
        activityLevel,
        workRoutine,
        fitnessGoal,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : null,
        typicalSleepHours: typicalSleepHours ? Number(typicalSleepHours) : null,
        markComplete: true,
      });
      onComplete(
        hasActivePlan ? { preferencesUpdatedWithActivePlan: true } : undefined,
      );
    } catch (err) {
      if (isWellnessApiError(err)) {
        setError(toUserFacingWellnessError(err.status, err.code, err.message));
      } else {
        setError("Unable to save wellness preferences.");
      }
    }
  }

  return (
    <Card className="mx-auto max-w-2xl border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-neutral-800">Wellness setup</CardTitle>
        <CardDescription>
          Tell us about your diet, lifestyle, and goals so we can personalize your plan.
        </CardDescription>
        <div className="pt-2">
          <OnboardingProgress steps={STEPS} currentStep={step} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasActivePlan ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Your current 4-week plan will stay as-is. Updated preferences apply when you
            generate your next plan.
          </div>
        ) : null}

        {step === 0 ? (
          <>
            <Field label="Dietary preference" htmlFor="diet">
              <FormSelect
                id="diet"
                value={dietaryPreference}
                onChange={(value) => setDietaryPreference(value as DietaryPreference)}
                options={Object.entries(DIETARY_PREFERENCE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>

            <Field
              label="Country"
              htmlFor="country"
              helper="Used to suggest culturally appropriate meals."
              error={fieldErrors.countryCode}
            >
              <CountrySelect
                id="country"
                value={countryCode}
                onChange={setCountryCode}
              />
            </Field>

            <Field
              label="Cuisine notes (optional)"
              htmlFor="cuisine"
              helper="Halal, avoid pork, prefer Mediterranean, etc."
            >
              <Input
                id="cuisine"
                value={cuisineNotes}
                onChange={(event) => setCuisineNotes(event.target.value)}
                placeholder="Prefer Mediterranean, avoid pork, halal..."
                className="rounded-xl"
              />
            </Field>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="Activity level" htmlFor="activity">
              <FormSelect
                id="activity"
                value={activityLevel}
                onChange={(value) => setActivityLevel(value as ActivityLevel)}
                options={Object.entries(ACTIVITY_LEVEL_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>

            <Field label="Work routine" htmlFor="work">
              <FormSelect
                id="work"
                value={workRoutine}
                onChange={(value) => setWorkRoutine(value as WorkRoutine)}
                options={Object.entries(WORK_ROUTINE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>

            <Field
              label="Typical sleep (hours)"
              htmlFor="sleep"
              helper="Average nightly sleep on a typical week."
              error={fieldErrors.typicalSleepHours}
            >
              <Input
                id="sleep"
                type="number"
                min={3}
                max={14}
                step={0.5}
                value={typicalSleepHours}
                onChange={(event) => setTypicalSleepHours(event.target.value)}
                className="rounded-xl"
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field label="Fitness goal" htmlFor="goal">
              <FormSelect
                id="goal"
                value={fitnessGoal}
                onChange={(value) => setFitnessGoal(value as FitnessGoal)}
                options={Object.entries(FITNESS_GOAL_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>

            <Field
              label="Target weight (kg, optional)"
              htmlFor="target-weight"
              error={fieldErrors.targetWeightKg}
            >
              <Input
                id="target-weight"
                type="number"
                min={20}
                max={500}
                step={0.1}
                value={targetWeightKg}
                onChange={(event) => setTargetWeightKg(event.target.value)}
                className="rounded-xl"
              />
            </Field>
          </>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="flex justify-between gap-3 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0 || mutation.isPending}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleContinue}
            className={cn(buttonVariants(), "rounded-xl")}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={mutation.isPending}
            className={cn(buttonVariants(), "rounded-xl")}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : existingPreferences?.isComplete ? (
              "Save preferences"
            ) : (
              "Complete setup"
            )}
          </button>
        )}
      </CardFooter>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {helper ? <p className="text-xs text-neutral-500">{helper}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function WellnessReadinessPanel({
  missing,
  onOpenWizard,
}: {
  missing: string[];
  onOpenWizard?: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-900">Complete these before generating your plan</h3>
          <ul className="mt-3 space-y-2 text-sm text-amber-800">
            {missing.map((item) => (
              <li key={item}>• {READINESS_LABELS[item] ?? item.replace(/_/g, " ")}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {missing.some((item) =>
              ["date_of_birth", "biological_sex", "height_cm", "weight_kg"].includes(item),
            ) ? (
              <Link
                href="/settings/profile"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Update profile
              </Link>
            ) : null}
            {missing.includes("wellness_preferences") && onOpenWizard ? (
              <button
                type="button"
                onClick={onOpenWizard}
                className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}
              >
                Complete wellness setup
              </button>
            ) : null}
            {missing.includes("lab_data_or_general_wellness_goal") ? (
              <Link
                href="/lab"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                View lab trends
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

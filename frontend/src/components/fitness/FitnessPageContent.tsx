"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, Info, X } from "lucide-react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { FitnessEmptyState } from "@/components/fitness/FitnessEmptyState";
import { MacroTargetsStrip } from "@/components/fitness/MacroTargetsStrip";
import { NutritionSummaryCard } from "@/components/fitness/MacroTargetsStrip";
import { PlanProgressStepper } from "@/components/fitness/PlanProgressStepper";
import { WeightTrendChart } from "@/components/fitness/WeightTrendChart";
import {
  WellnessReadinessPanel,
  WellnessSetupWizard,
} from "@/components/fitness/WellnessSetupWizard";
import { WellnessPlanView } from "@/components/fitness/WellnessPlanView";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCountryName } from "@/lib/constants/countries";
import { isWellnessApiError, toUserFacingWellnessError } from "@/lib/api/wellness";
import { isPlanStale } from "@/lib/wellness/coachFeedback";
import {
  useActiveWellnessPlan,
  useGenerateWellnessPlan,
  useNutritionTargets,
  usePlanCheckins,
  useWeightMeasurements,
  useWellnessPreferences,
  useWellnessReadiness,
} from "@/hooks/useWellness";
import {
  DIETARY_PREFERENCE_LABELS,
  FITNESS_GOAL_LABELS,
  READINESS_LABELS,
} from "@/types/wellness";
import { cn } from "@/lib/utils";

const PROFILE_AND_PREFERENCE_REQUIREMENTS = [
  "date_of_birth",
  "biological_sex",
  "height_cm",
  "weight_kg",
  "wellness_preferences",
] as const;

function isProfileAndPreferencesReady(missing: string[]): boolean {
  return !missing.some((item) =>
    PROFILE_AND_PREFERENCE_REQUIREMENTS.includes(
      item as (typeof PROFILE_AND_PREFERENCE_REQUIREMENTS)[number],
    ),
  );
}

function FitnessPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-neutral-100" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-8 w-24 rounded-full bg-neutral-100" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-20 rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-neutral-100" />
    </div>
  );
}

export function FitnessPageContent() {
  const { data: readiness, isLoading: readinessLoading } = useWellnessReadiness();
  const { data: preferences, isLoading: preferencesLoading } = useWellnessPreferences();
  const { data: activePlan, isLoading: planLoading } = useActiveWellnessPlan();
  const { data: weights = [], isLoading: weightsLoading } = useWeightMeasurements();
  const generatePlan = useGenerateWellnessPlan();
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferencesSavedNotice, setPreferencesSavedNotice] = useState<string | null>(null);
  const [staleBannerDismissed, setStaleBannerDismissed] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);

  const canPreviewTargets =
    Boolean(preferences?.isComplete) && (readiness?.missing.length ?? 1) <= 1;
  const { data: previewTargets } = useNutritionTargets(canPreviewTargets);
  const { data: checkins = [] } = usePlanCheckins(activePlan?.id ?? "");

  const isLoading = readinessLoading || preferencesLoading || planLoading;

  const completedWeeks = useMemo(
    () => checkins.map((item) => item.weekNumber),
    [checkins],
  );

  const planIsStale = useMemo(
    () =>
      Boolean(
        activePlan &&
          preferences &&
          isPlanStale(preferences.updatedAt, activePlan.generatedAt),
      ),
    [activePlan, preferences],
  );

  const canRegeneratePlan = useMemo(
    () => Boolean(activePlan) && isProfileAndPreferencesReady(readiness?.missing ?? []),
    [activePlan, readiness?.missing],
  );

  const summaryChips = useMemo(() => {
    if (!preferences?.isComplete) {
      return [];
    }

    const chips = [
      preferences.fitnessGoal
        ? FITNESS_GOAL_LABELS[preferences.fitnessGoal]
        : null,
      preferences.dietaryPreference
        ? DIETARY_PREFERENCE_LABELS[preferences.dietaryPreference]
        : null,
      preferences.countryCode
        ? getCountryName(preferences.countryCode) ?? preferences.countryCode
        : null,
      previewTargets ? `BMI ${previewTargets.bmi}` : null,
    ].filter(Boolean) as string[];

    return chips;
  }, [preferences, previewTargets]);

  async function handleGeneratePlan(): Promise<boolean> {
    setError(null);

    try {
      await generatePlan.mutateAsync();
      setStaleBannerDismissed(false);
      setPreferencesSavedNotice(null);
      return true;
    } catch (err) {
      if (isWellnessApiError(err)) {
        setError(toUserFacingWellnessError(err.status, err.code, err.message));
      } else {
        setError("Unable to generate your wellness plan.");
      }
      return false;
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <FitnessPageSkeleton />
      </div>
    );
  }

  const needsWizard = !preferences?.isComplete || showWizard;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Fitness" },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Fitness & Wellness</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Personalized nutrition and activity plans grounded in your lab results, lifestyle,
              and goals.
            </p>
            {summaryChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {summaryChips.map((chip) => (
                  <Badge key={chip} variant="outline" className="rounded-full bg-white">
                    {chip}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {preferences?.isComplete ? (
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            >
              Edit wellness preferences
            </button>
          ) : null}
        </div>
      </div>

      {needsWizard ? (
        <WellnessSetupWizard
          hasActivePlan={Boolean(activePlan)}
          onComplete={(result) => {
            setShowWizard(false);
            if (result?.preferencesUpdatedWithActivePlan && activePlan) {
              setPreferencesSavedNotice(
                `Preferences saved. Your current plan (week ${Math.min(activePlan.currentWeek, 4)} of 4) is unchanged. Generate a new plan when you're ready to apply these updates.`,
              );
              setStaleBannerDismissed(false);
            }
          }}
        />
      ) : null}

      {preferencesSavedNotice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          {preferencesSavedNotice}
        </div>
      ) : null}

      {!needsWizard && !activePlan ? (
        <div className="space-y-6">
          {!readiness?.canGeneratePlan ? (
            <WellnessReadinessPanel
              missing={readiness?.missing ?? []}
              onOpenWizard={() => setShowWizard(true)}
            />
          ) : null}

          {previewTargets ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-neutral-800">Your computed targets</h2>
              <MacroTargetsStrip targets={previewTargets} />
            </section>
          ) : null}

          <FitnessEmptyState
            icon={Dumbbell}
            title="Generate your personalized wellness plan"
            description="AI will create a 4-week plan with activity targets, daily meal suggestions, and sleep guidance tailored to your biomarkers and nutrition targets."
            actionLabel={
              generatePlan.isPending ? "Generating plan..." : "Generate 4-week plan"
            }
            onAction={() => void handleGeneratePlan()}
            actionDisabled={!readiness?.canGeneratePlan}
            actionPending={generatePlan.isPending}
            error={error}
            footer={
              !readiness?.hasConcerningOrBorderlineBiomarkers
                ? 'No concerning lab markers found. Choose "General wellness" as your goal to generate without lab data.'
                : undefined
            }
          />
        </div>
      ) : null}

      {!needsWizard && activePlan ? (
        <>
          {planIsStale && !staleBannerDismissed ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>
                    Your wellness preferences were updated after this plan was created. Meal and
                    activity guidance reflect your previous settings.
                  </p>
                  {!canRegeneratePlan && (readiness?.missing.length ?? 0) > 0 ? (
                    <p className="mt-2 text-blue-700">
                      Complete these before regenerating:{" "}
                      {(readiness?.missing ?? [])
                        .map((item) => READINESS_LABELS[item] ?? item.replace(/_/g, " "))
                        .join(", ")}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setRegenerateConfirmOpen(true)}
                    disabled={generatePlan.isPending || !canRegeneratePlan}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "mt-3 rounded-xl bg-white",
                    )}
                  >
                    {generatePlan.isPending ? "Generating..." : "Generate new plan"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStaleBannerDismissed(true)}
                  className="shrink-0 rounded-lg p-1 text-blue-600 hover:bg-blue-100"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <PlanProgressStepper
            currentWeek={activePlan.currentWeek}
            completedWeeks={completedWeeks}
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <WellnessPlanView plan={activePlan} checkins={checkins} />
            <aside className="space-y-4">
              <NutritionSummaryCard targets={activePlan.nutritionTargets} />
              {!weightsLoading ? <WeightTrendChart measurements={weights} /> : null}
              <Link
                href="/lab"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full rounded-xl",
                )}
              >
                View lab trends
              </Link>
            </aside>
          </div>

          <ConfirmDialog
            open={regenerateConfirmOpen}
            onOpenChange={setRegenerateConfirmOpen}
            title="Generate a new plan?"
            description="This will replace your current plan and reset progress to week 1. Your check-in history for this plan will no longer be shown."
            confirmLabel="Generate new plan"
            isLoading={generatePlan.isPending}
            onConfirm={async () => {
              const succeeded = await handleGeneratePlan();
              if (succeeded) {
                setRegenerateConfirmOpen(false);
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
}

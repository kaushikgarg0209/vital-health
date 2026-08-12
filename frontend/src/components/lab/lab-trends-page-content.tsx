"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { BiomarkerCard } from "@/components/lab/biomarker-card";
import { LabEmptyState } from "@/components/lab/lab-empty-state";
import { LabStatsStrip } from "@/components/lab/lab-stats-strip";
import { ManualReadingDialog } from "@/components/lab/manual-reading-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useLabBiomarkers } from "@/hooks/useLab";
import { cn } from "@/lib/utils";
import type { TrackedBiomarker } from "@/types/lab";

function LabPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-44 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

export function LabTrendsPageContent() {
  const { data, isLoading, isError } = useLabBiomarkers();
  const [manualOpen, setManualOpen] = useState(false);

  const allBiomarkers = useMemo(() => {
    if (!data) {
      return [] as TrackedBiomarker[];
    }

    return data.categories.flatMap((category) => category.biomarkers);
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Lab Trends" },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Lab Trends</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Track biomarkers over time, spot changes early, and get AI-powered insights from your
              lab results.
            </p>
          </div>

          {data && data.totalTracked > 0 ? (
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className={cn(buttonVariants(), "shrink-0 rounded-xl")}
            >
              <Plus className="size-4" />
              Log reading
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? <LabPageSkeleton /> : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load biomarkers. Please refresh the page.
        </div>
      ) : null}

      {data && !isLoading ? (
        <>
          <LabStatsStrip
            totalTracked={data.totalTracked}
            concerningCount={data.concerningCount}
            borderlineCount={data.borderlineCount}
          />

          {data.totalTracked === 0 ? (
            <LabEmptyState onLogManual={() => setManualOpen(true)} />
          ) : (
            <div className="space-y-8">
              {data.categories.map((category) => (
                <section key={category.category} className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                    {category.category}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {category.biomarkers.map((biomarker) => (
                      <BiomarkerCard key={biomarker.biomarkerKey} biomarker={biomarker} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : null}

      <ManualReadingDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        biomarkerOptions={allBiomarkers}
      />
    </div>
  );
}

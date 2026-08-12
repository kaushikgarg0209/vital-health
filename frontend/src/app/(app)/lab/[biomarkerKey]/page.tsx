"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { BiomarkerInsightPanel } from "@/components/lab/biomarker-insight-panel";
import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import { ManualReadingDialog } from "@/components/lab/manual-reading-dialog";
import { ReadingsTable } from "@/components/lab/readings-table";
import { TrendChart } from "@/components/lab/trend-chart";
import { TrendDirectionBadge } from "@/components/lab/trend-direction-badge";
import { buttonVariants } from "@/components/ui/button";
import { isLabApiError } from "@/lib/api/lab";
import { formatLabDate, formatReferenceRange } from "@/lib/lab-utils";
import { useBiomarkerDetail } from "@/hooks/useLab";
import { cn } from "@/lib/utils";

type BiomarkerDetailPageContentProps = {
  biomarkerKey: string;
};

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-xl bg-neutral-100" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-96 rounded-xl bg-neutral-100 lg:col-span-3" />
        <div className="h-96 rounded-xl bg-neutral-100 lg:col-span-2" />
      </div>
      <div className="h-64 rounded-xl bg-neutral-100" />
    </div>
  );
}

export function BiomarkerDetailPageContent({ biomarkerKey }: BiomarkerDetailPageContentProps) {
  const { data, isLoading, isError, error } = useBiomarkerDetail(biomarkerKey);
  const [manualOpen, setManualOpen] = useState(false);

  const notFound =
    isError && isLabApiError(error) && error.status === 404;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Lab Trends", href: "/lab" },
            { label: biomarkerKey },
          ]}
        />
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">No readings found for this biomarker.</p>
          <Link
            href="/lab"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex rounded-xl")}
          >
            <ArrowLeft className="size-4" />
            Back to Lab Trends
          </Link>
        </div>
      </div>
    );
  }

  const summary = data.summary;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-6">
      <AppBreadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Lab Trends", href: "/lab" },
          { label: data.displayName },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {data.category}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-800">{data.displayName}</h1>
          {data.referenceRange ? (
            <p className="mt-2 text-sm text-neutral-500">
              Reference: {formatReferenceRange(data.referenceRange, data.unit)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className={cn(buttonVariants(), "hidden rounded-xl sm:inline-flex")}
        >
          <Plus className="size-4" />
          Log reading
        </button>
      </div>

      {summary ? (
        <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-500">Latest reading</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-neutral-800">
                {summary.latestValue}
                <span className="ml-2 text-lg font-normal text-neutral-400">{data.unit}</span>
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {formatLabDate(summary.latestDate)}
                {summary.previousValue != null
                  ? ` · Previous ${summary.previousValue} ${data.unit}`
                  : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BiomarkerStatusBadge status={summary.status} />
              <TrendDirectionBadge
                direction={summary.trend.direction}
                deltaPct={summary.trend.deltaPct}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
        <TrendChart
          readings={data.readings}
          unit={data.unit}
          referenceRange={data.referenceRange}
          className="lg:col-span-3"
        />
        <BiomarkerInsightPanel biomarkerKey={biomarkerKey} className="lg:col-span-2" />
      </div>

      <ReadingsTable readings={data.readings} unit={data.unit} />

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 sm:hidden">
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className={cn(buttonVariants(), "w-full rounded-xl")}
        >
          <Plus className="size-4" />
          Log new reading
        </button>
      </div>

      <ManualReadingDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        biomarker={{
          biomarkerKey: data.biomarkerKey,
          biomarkerName: data.displayName,
          displayName: data.displayName,
          unit: data.unit,
        }}
      />
    </div>
  );
}

type PageProps = {
  params: Promise<{ biomarkerKey: string }>;
};

export default function BiomarkerDetailPage({ params }: PageProps) {
  const { biomarkerKey } = use(params);
  return <BiomarkerDetailPageContent biomarkerKey={biomarkerKey} />;
}

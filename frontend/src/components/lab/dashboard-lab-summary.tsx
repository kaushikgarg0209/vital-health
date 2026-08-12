"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import { TrendDirectionBadge } from "@/components/lab/trend-direction-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLabBiomarkers } from "@/hooks/useLab";
import {
  getDashboardRowAccentClass,
  needsAttentionStatus,
  sortBiomarkersForDashboard,
} from "@/lib/lab-utils";
import { cn } from "@/lib/utils";
import type { TrackedBiomarker } from "@/types/lab";

const DASHBOARD_PREVIEW_LIMIT = 5;

function DashboardBiomarkerRow({ biomarker }: { biomarker: TrackedBiomarker }) {
  const accentClass = getDashboardRowAccentClass(biomarker.status);

  return (
    <li>
      <Link
        href={`/lab/${biomarker.biomarkerKey}`}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-neutral-50",
          accentClass,
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-800">{biomarker.displayName}</p>
          <p className="text-xs text-neutral-400">
            {biomarker.latestValue} {biomarker.unit}
          </p>
          {needsAttentionStatus(biomarker.status) ? (
            <div className="mt-1.5">
              <TrendDirectionBadge
                direction={biomarker.trendDirection}
                deltaPct={biomarker.deltaPct}
              />
            </div>
          ) : null}
        </div>
        <BiomarkerStatusBadge status={biomarker.status} size="sm" />
      </Link>
    </li>
  );
}

export function DashboardLabSummary() {
  const { data, isLoading } = useLabBiomarkers();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="animate-pulse border-neutral-100">
            <CardHeader>
              <div className="h-4 w-24 rounded bg-neutral-100" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 rounded bg-neutral-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const allBiomarkers =
    data?.categories.flatMap((category) => category.biomarkers) ?? [];
  const sortedBiomarkers = sortBiomarkersForDashboard(allBiomarkers);
  const preview = sortedBiomarkers.slice(0, DASHBOARD_PREVIEW_LIMIT);
  const allNormal =
    allBiomarkers.length > 0 &&
    allBiomarkers.every((biomarker) => biomarker.status === "normal" || biomarker.status === null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-neutral-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Biomarkers tracked</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-neutral-800">
              {data?.totalTracked ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Needs attention</CardDescription>
            <CardTitle
              className={`text-3xl font-bold tabular-nums ${(data?.concerningCount ?? 0) > 0 ? "text-rose-600" : "text-neutral-800"}`}
            >
              {data?.concerningCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Borderline</CardDescription>
            <CardTitle
              className={`text-3xl font-bold tabular-nums ${(data?.borderlineCount ?? 0) > 0 ? "text-amber-600" : "text-neutral-800"}`}
            >
              {data?.borderlineCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-neutral-100 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-neutral-800">Lab Trends</CardTitle>
              <CardDescription className="mt-1">
                {data && data.totalTracked > 0
                  ? `${data.totalTracked} biomarker${data.totalTracked === 1 ? "" : "s"} tracked`
                  : "Upload a lab report to start tracking trends"}
              </CardDescription>
            </div>
          </div>
          {data && data.totalTracked > 0 ? (
            <Link
              href="/lab"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </CardHeader>
        <CardContent>
          {preview.length > 0 ? (
            <div className="space-y-3">
              <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-100">
                {preview.map((item) => (
                  <DashboardBiomarkerRow key={item.biomarkerKey} biomarker={item} />
                ))}
              </ul>
              {allNormal ? (
                <p className="text-sm text-neutral-500">All results within expected range.</p>
              ) : null}
              {sortedBiomarkers.length > DASHBOARD_PREVIEW_LIMIT ? (
                <Link
                  href="/lab"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all {sortedBiomarkers.length} biomarkers
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </div>
          ) : (
            <Link
              href="/records/upload"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Upload your first lab report
              <ArrowRight className="size-4" />
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

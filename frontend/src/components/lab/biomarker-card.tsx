import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BiomarkerSparkline } from "@/components/lab/biomarker-sparkline";
import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import { TrendDirectionBadge } from "@/components/lab/trend-direction-badge";
import { formatLabDate, getStatusBorderClass } from "@/lib/lab-utils";
import { cn } from "@/lib/utils";
import type { TrackedBiomarker } from "@/types/lab";

type BiomarkerCardProps = {
  biomarker: TrackedBiomarker;
};

export function BiomarkerCard({ biomarker }: BiomarkerCardProps) {
  return (
    <Link
      href={`/lab/${biomarker.biomarkerKey}`}
      className={cn(
        "group flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-all",
        getStatusBorderClass(biomarker.status),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-800">{biomarker.displayName}</p>
          <p className="mt-0.5 text-xs text-neutral-400">{biomarker.category}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500" />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-800">
            {biomarker.latestValue}
            <span className="ml-1 text-sm font-normal text-neutral-400">{biomarker.unit}</span>
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Last reading · {formatLabDate(biomarker.latestDate)}
          </p>
        </div>
        <BiomarkerSparkline
          points={biomarker.recentReadings}
          status={biomarker.status}
          className="w-24 shrink-0"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BiomarkerStatusBadge status={biomarker.status} size="sm" />
        <TrendDirectionBadge
          direction={biomarker.trendDirection}
          deltaPct={biomarker.deltaPct}
        />
      </div>
    </Link>
  );
}

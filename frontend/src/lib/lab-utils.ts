import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { BiomarkerStatus } from "@/lib/tokens";
import { biomarkerStatus } from "@/lib/tokens";
import type { ChartTimeRange, LabReading, LabTrendDirection } from "@/types/lab";

export function formatLabDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDeltaPct(deltaPct: number | null): string | null {
  if (deltaPct === null) {
    return null;
  }

  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}

export function formatReferenceRange(
  range: { low: number | null; high: number | null } | null,
  unit: string,
): string {
  if (!range) {
    return "Reference range not available";
  }

  if (range.low !== null && range.high !== null) {
    return `${range.low}–${range.high} ${unit}`;
  }

  if (range.high !== null) {
    return `≤ ${range.high} ${unit}`;
  }

  if (range.low !== null) {
    return `≥ ${range.low} ${unit}`;
  }

  return "Reference range not available";
}

export const labTrendDirection = {
  rising: {
    label: "Rising",
    icon: TrendingUp,
    textClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
  falling: {
    label: "Falling",
    icon: TrendingDown,
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  stable: {
    label: "Stable",
    icon: Minus,
    textClass: "text-neutral-500",
    bgClass: "bg-neutral-50",
  },
} satisfies Record<
  LabTrendDirection,
  {
    label: string;
    icon: typeof TrendingUp;
    textClass: string;
    bgClass: string;
  }
>;

export function getStatusBorderClass(status: BiomarkerStatus | null): string {
  if (!status) {
    return "border-neutral-200 hover:border-neutral-300";
  }

  return `${biomarkerStatus[status].borderClass} hover:shadow-md`;
}

export function filterReadingsByRange(
  readings: LabReading[],
  range: ChartTimeRange,
): LabReading[] {
  if (range === "ALL") {
    return readings;
  }

  const months = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);

  return readings.filter((reading) => {
    const date = new Date(`${reading.readingDate}T00:00:00.000Z`);
    return date >= cutoff;
  });
}

export function alertTypeLabel(alertType: string): string {
  switch (alertType) {
    case "status_change":
      return "Status changed";
    case "large_delta":
      return "Significant change";
    case "consecutive_high":
      return "Consecutive high";
    default:
      return "Alert";
  }
}

export function sourceLabel(source: LabReading["source"]): string {
  return source === "lab_report" ? "Lab report" : "Manual log";
}

function createdAtMs(value: string): number {
  return new Date(value).getTime();
}

export function compareLabReadings(
  left: LabReading,
  right: LabReading,
  order: "asc" | "desc" = "desc",
): number {
  const dateDiff =
    new Date(`${left.readingDate}T00:00:00.000Z`).getTime() -
    new Date(`${right.readingDate}T00:00:00.000Z`).getTime();

  if (dateDiff !== 0) {
    return order === "desc" ? -dateDiff : dateDiff;
  }

  const createdDiff = createdAtMs(left.createdAt) - createdAtMs(right.createdAt);
  return order === "desc" ? -createdDiff : createdDiff;
}

export function formatChartTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatChartLabel(reading: LabReading, includeTime: boolean): string {
  const dateLabel = formatLabDate(reading.readingDate);

  if (includeTime) {
    return `${dateLabel} · ${formatChartTime(reading.createdAt)}`;
  }

  return dateLabel;
}

export function buildChartLabels(readings: LabReading[]): Map<string, string> {
  const sorted = [...readings].sort((left, right) => compareLabReadings(left, right, "asc"));
  const labels = new Map<string, string>();
  const countByDate = new Map<string, number>();

  for (const reading of sorted) {
    countByDate.set(reading.readingDate, (countByDate.get(reading.readingDate) ?? 0) + 1);
  }

  for (const reading of sorted) {
    const multiOnDay = (countByDate.get(reading.readingDate) ?? 0) > 1;
    labels.set(reading.id, formatChartLabel(reading, multiOnDay));
  }

  return labels;
}

const STATUS_RANK: Record<BiomarkerStatus, number> = {
  critical: 0,
  concerning: 1,
  borderline: 2,
  normal: 3,
};

export function sortBiomarkersForDashboard<T extends {
  status: BiomarkerStatus | null;
  latestDate: string;
}>(biomarkers: T[]): T[] {
  return [...biomarkers].sort((left, right) => {
    const leftRank = left.status ? STATUS_RANK[left.status] : 4;
    const rightRank = right.status ? STATUS_RANK[right.status] : 4;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return right.latestDate.localeCompare(left.latestDate);
  });
}

export function formatBiomarkerKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function needsAttentionStatus(status: BiomarkerStatus | null): boolean {
  return status === "borderline" || status === "concerning" || status === "critical";
}

export function getDashboardRowAccentClass(status: BiomarkerStatus | null): string {
  if (!needsAttentionStatus(status)) {
    return "";
  }

  switch (status) {
    case "critical":
      return "border-l-2 border-l-rose-400";
    case "concerning":
      return "border-l-2 border-l-red-300";
    case "borderline":
      return "border-l-2 border-l-amber-400";
    default:
      return "";
  }
}

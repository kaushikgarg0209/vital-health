import type { BiomarkerStatus } from "../../utils/extractionValues.js";
import type { ReferenceRange } from "./referenceRangeService.js";

export type TrendDirection = "rising" | "falling" | "stable";

export type BiomarkerReadingPoint = {
  value: number;
  readingDate: string;
  createdAt?: string;
};

export type ReadingSortOrder = "asc" | "desc";

function createdAtMs(value: string | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

export function compareReadingPoints(
  left: BiomarkerReadingPoint,
  right: BiomarkerReadingPoint,
  order: ReadingSortOrder = "desc",
): number {
  const dateDiff =
    parseDate(left.readingDate).getTime() - parseDate(right.readingDate).getTime();

  if (dateDiff !== 0) {
    return order === "desc" ? -dateDiff : dateDiff;
  }

  const createdDiff = createdAtMs(left.createdAt) - createdAtMs(right.createdAt);
  return order === "desc" ? -createdDiff : createdDiff;
}

export type TrendResult = {
  direction: TrendDirection;
  slope: number;
  deltaPct: number | null;
  readingCount: number;
};

export type TrendSummary = {
  latestValue: number;
  latestDate: string;
  previousValue: number | null;
  status: BiomarkerStatus | null;
  trend: TrendResult;
};

const SLOPE_THRESHOLD = 0.05;
const DEFAULT_MAX_POINTS = 5;

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

function leastSquaresSlope(points: Array<{ x: number; y: number }>): number {
  const n = points.length;

  if (n < 2) {
    return 0;
  }

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

export function calculateTrend(
  readings: BiomarkerReadingPoint[],
  maxPoints = DEFAULT_MAX_POINTS,
): TrendResult {
  if (readings.length === 0) {
    return {
      direction: "stable",
      slope: 0,
      deltaPct: null,
      readingCount: 0,
    };
  }

  const sorted = [...readings].sort((left, right) =>
    compareReadingPoints(left, right, "asc"),
  );

  const window = sorted.slice(-maxPoints);
  const firstDate = parseDate(window[0]!.readingDate);

  const regressionPoints = window.map((reading) => ({
    x: daysBetween(firstDate, parseDate(reading.readingDate)),
    y: reading.value,
  }));

  const slope = leastSquaresSlope(regressionPoints);

  let direction: TrendDirection = "stable";

  if (slope > SLOPE_THRESHOLD) {
    direction = "rising";
  } else if (slope < -SLOPE_THRESHOLD) {
    direction = "falling";
  }

  const latest = sorted[sorted.length - 1]!;
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2]! : null;

  const deltaPct =
    previous && previous.value !== 0
      ? ((latest.value - previous.value) / previous.value) * 100
      : null;

  return {
    direction,
    slope,
    deltaPct,
    readingCount: sorted.length,
  };
}

export function determineStatus(
  value: number,
  range: Pick<ReferenceRange, "low" | "high">,
): BiomarkerStatus {
  const { low, high } = range;

  if (low !== null && high !== null) {
    if (value >= low && value <= high) {
      return "normal";
    }

    const span = Math.max(high - low, 1);
    const borderlineMargin = span * 0.1;

    if (value < low) {
      if (value >= low - borderlineMargin) {
        return "borderline";
      }

      if (value >= low - span * 0.25) {
        return "concerning";
      }

      return "critical";
    }

    if (value <= high + borderlineMargin) {
      return "borderline";
    }

    if (value <= high + span * 0.25) {
      return "concerning";
    }

    return "critical";
  }

  if (high !== null) {
    if (value <= high) {
      return "normal";
    }

    const margin = Math.max(high * 0.1, 1);

    if (value <= high + margin) {
      return "borderline";
    }

    if (value <= high * 1.25) {
      return "concerning";
    }

    return "critical";
  }

  if (low !== null) {
    if (value >= low) {
      return "normal";
    }

    const margin = Math.max(low * 0.1, 1);

    if (value >= low - margin) {
      return "borderline";
    }

    if (value >= low * 0.75) {
      return "concerning";
    }

    return "critical";
  }

  return "normal";
}

export function buildTrendSummary(
  readings: BiomarkerReadingPoint[],
  range: ReferenceRange | null,
): TrendSummary | null {
  if (readings.length === 0) {
    return null;
  }

  const sorted = [...readings].sort((left, right) =>
    compareReadingPoints(left, right, "desc"),
  );

  const latest = sorted[0]!;
  const previous = sorted.length >= 2 ? sorted[1]! : null;
  const trend = calculateTrend(readings);

  const status = range
    ? determineStatus(latest.value, range)
    : null;

  return {
    latestValue: latest.value,
    latestDate: latest.readingDate,
    previousValue: previous?.value ?? null,
    status,
    trend,
  };
}

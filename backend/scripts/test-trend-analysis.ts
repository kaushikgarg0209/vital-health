import {
  buildTrendSummary,
  calculateTrend,
  compareReadingPoints,
  type BiomarkerReadingPoint,
} from "../src/services/lab/trendAnalysis.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testSameDayTieBreakDesc(): void {
  const older: BiomarkerReadingPoint = {
    value: 95,
    readingDate: "2026-08-12",
    createdAt: "2026-08-12T18:12:34.208414+00:00",
  };
  const newer: BiomarkerReadingPoint = {
    value: 204,
    readingDate: "2026-08-12",
    createdAt: "2026-08-12T18:24:06.505811+00:00",
  };

  assert(
    compareReadingPoints(newer, older, "desc") < 0,
    "Newer created_at entry should sort first in desc order",
  );

  const sorted = [older, newer].sort((left, right) =>
    compareReadingPoints(left, right, "desc"),
  );

  assert(sorted[0]!.value === 204, "Latest same-day reading should be 204");
}

function testSummaryAndTrendConsistency(): void {
  const readings: BiomarkerReadingPoint[] = [
    {
      value: 95,
      readingDate: "2026-08-12",
      createdAt: "2026-08-12T18:12:34.208414+00:00",
    },
    {
      value: 204,
      readingDate: "2026-08-12",
      createdAt: "2026-08-12T18:24:06.505811+00:00",
    },
    {
      value: 101,
      readingDate: "2026-08-11",
      createdAt: "2026-08-12T18:14:38.199316+00:00",
    },
  ];

  const summary = buildTrendSummary(readings, { low: 70, high: 99 } as never);
  const trend = calculateTrend(readings);

  assert(summary !== null, "Summary should exist");
  assert(summary!.latestValue === 204, "Summary latest should be 204");
  assert(summary!.previousValue === 95, "Summary previous should be 95 on same day");
  assert(trend.deltaPct !== null, "deltaPct should be computed");
  assert(
    Math.abs(trend.deltaPct! - ((204 - 95) / 95) * 100) < 0.01,
    "deltaPct should match latest vs previous chronological pair",
  );
  assert(
    summary!.trend.deltaPct === trend.deltaPct,
    "buildTrendSummary trend deltaPct should match calculateTrend",
  );
}

function testDateOnlyReadingsUnchanged(): void {
  const readings: BiomarkerReadingPoint[] = [
    { value: 92, readingDate: "2026-05-01" },
    { value: 98, readingDate: "2026-06-01" },
    { value: 108, readingDate: "2026-07-01" },
  ];

  const trend = calculateTrend(readings);
  assert(trend.direction === "rising", "Distinct dates without createdAt should still trend rising");
  assert(trend.deltaPct !== null && trend.deltaPct > 0, "Latest value should be higher than previous");
}

function main(): void {
  console.log("=== Trend analysis unit tests ===\n");

  testSameDayTieBreakDesc();
  console.log("  same-day tie-break (desc): ok");

  testSummaryAndTrendConsistency();
  console.log("  summary/trend consistency: ok");

  testDateOnlyReadingsUnchanged();
  console.log("  date-only readings unchanged: ok");

  console.log("\n=== Trend analysis unit tests passed ===");
}

main();

import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { cacheDel, insightCacheKey } from "../cache/cacheService.js";
import { notifyFamilyCaregivers } from "../family/familyAlertService.js";
import { getProfileByUserId } from "../profileService.js";
import type { BiomarkerStatus } from "../../utils/extractionValues.js";
import {
  calculateAge,
  getAdjustedReferenceRange,
  listReferenceCatalog,
} from "./referenceRangeService.js";
import {
  buildTrendSummary,
  calculateTrend,
  compareReadingPoints,
  determineStatus,
  type BiomarkerReadingPoint,
} from "./trendAnalysis.js";

export class LabError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "LabError";
  }
}

export type BiomarkerReadingRow = {
  id: string;
  biomarker_key: string;
  biomarker_name: string;
  value: number;
  unit: string;
  reference_range_low: number | null;
  reference_range_high: number | null;
  status: BiomarkerStatus | null;
  reading_date: string;
  source: "lab_report" | "manual";
  notes: string | null;
  created_at: string;
};

export type BiomarkerReading = {
  id: string;
  biomarkerKey: string;
  biomarkerName: string;
  value: number;
  unit: string;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  status: BiomarkerStatus | null;
  readingDate: string;
  source: "lab_report" | "manual";
  notes: string | null;
  createdAt: string;
};

export type BiomarkerAlert = {
  id: string;
  biomarkerKey: string;
  alertType: "status_change" | "large_delta" | "consecutive_high";
  previousValue: number | null;
  newValue: number | null;
  previousStatus: BiomarkerStatus | null;
  newStatus: BiomarkerStatus | null;
  isRead: boolean;
  createdAt: string;
};

function mapReading(row: BiomarkerReadingRow): BiomarkerReading {
  return {
    id: row.id,
    biomarkerKey: row.biomarker_key,
    biomarkerName: row.biomarker_name,
    value: Number(row.value),
    unit: row.unit,
    referenceRangeLow: row.reference_range_low,
    referenceRangeHigh: row.reference_range_high,
    status: row.status,
    readingDate: row.reading_date,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function fetchReadingsForBiomarker(
  userId: string,
  biomarkerKey: string,
  limit = 50,
): Promise<BiomarkerReading[]> {
  const { data, error } = await supabaseAdmin
    .from("biomarker_readings")
    .select("*")
    .eq("user_id", userId)
    .eq("biomarker_key", biomarkerKey)
    .order("reading_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new LabError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data as BiomarkerReadingRow[]).map(mapReading);
}

export async function listTrackedBiomarkers(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("biomarker_readings")
    .select("biomarker_key, biomarker_name, value, unit, reading_date, status, created_at")
    .eq("user_id", userId)
    .order("reading_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new LabError(error.message, 500, "INTERNAL_ERROR");
  }

  const profile = await getProfileByUserId(userId);
  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const catalog = await listReferenceCatalog();
  const catalogByKey = new Map(catalog.map((item) => [item.biomarkerKey, item]));

  const latestByKey = new Map<
    string,
    {
      biomarkerKey: string;
      biomarkerName: string;
      latestValue: number;
      unit: string;
      latestDate: string;
      status: BiomarkerStatus | null;
      category: string;
      displayName: string;
      trendDirection: string;
      deltaPct: number | null;
      readingCount: number;
      recentReadings: Array<{ value: number; readingDate: string }>;
    }
  >();

  type TrackedPoint = BiomarkerReadingPoint & {
    biomarkerName: string;
    unit: string;
    rawStatus: BiomarkerStatus | null;
  };

  const readingsByKey = new Map<string, TrackedPoint[]>();

  for (const row of data ?? []) {
    const key = row.biomarker_key;

    if (!readingsByKey.has(key)) {
      readingsByKey.set(key, []);
    }

    readingsByKey.get(key)!.push({
      value: Number(row.value),
      readingDate: row.reading_date,
      createdAt: row.created_at,
      biomarkerName: row.biomarker_name,
      unit: row.unit,
      rawStatus: row.status,
    });
  }

  for (const [key, points] of readingsByKey.entries()) {
    const sortedPoints = [...points].sort((left, right) =>
      compareReadingPoints(left, right, "desc"),
    );
    const latestPoint = sortedPoints[0]!;
    const referenceRange = await getAdjustedReferenceRange(
      key,
      age,
      profile?.biological_sex ?? null,
    );

    const summary = buildTrendSummary(sortedPoints, referenceRange);
    const catalogMeta = catalogByKey.get(key);
    const chronological = [...sortedPoints].sort((left, right) =>
      compareReadingPoints(left, right, "asc"),
    );
    const recentReadings = chronological.slice(-5).map((point) => ({
      value: point.value,
      readingDate: point.readingDate,
    }));

    latestByKey.set(key, {
      biomarkerKey: key,
      biomarkerName: latestPoint.biomarkerName,
      latestValue: latestPoint.value,
      unit: latestPoint.unit,
      latestDate: latestPoint.readingDate,
      status: summary?.status ?? latestPoint.rawStatus,
      category: catalogMeta?.category ?? referenceRange?.category ?? "Other",
      displayName:
        catalogMeta?.displayName ?? referenceRange?.displayName ?? latestPoint.biomarkerName,
      trendDirection: summary?.trend.direction ?? "stable",
      deltaPct: summary?.trend.deltaPct ?? null,
      readingCount: sortedPoints.length,
      recentReadings,
    });
  }

  const grouped = new Map<string, Array<(typeof latestByKey extends Map<string, infer V> ? V : never)>>();

  for (const item of latestByKey.values()) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  const categories = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, biomarkers]) => ({
      category,
      biomarkers: biomarkers.sort((left, right) =>
        left.displayName.localeCompare(right.displayName),
      ),
    }));

  const concerningCount = [...latestByKey.values()].filter(
    (item) => item.status === "concerning" || item.status === "critical",
  ).length;

  const borderlineCount = [...latestByKey.values()].filter(
    (item) => item.status === "borderline",
  ).length;

  return {
    totalTracked: latestByKey.size,
    concerningCount,
    borderlineCount,
    categories,
  };
}

export async function getBiomarkerDetail(userId: string, biomarkerKey: string) {
  const readings = await fetchReadingsForBiomarker(userId, biomarkerKey);
  const profile = await getProfileByUserId(userId);
  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const referenceRange = await getAdjustedReferenceRange(
    biomarkerKey,
    age,
    profile?.biological_sex ?? null,
  );

  const points: BiomarkerReadingPoint[] = readings.map((reading) => ({
    value: reading.value,
    readingDate: reading.readingDate,
    createdAt: reading.createdAt,
  }));

  const summary = buildTrendSummary(points, referenceRange);

  return {
    biomarkerKey,
    displayName: referenceRange?.displayName ?? readings[0]?.biomarkerName ?? biomarkerKey,
    category: referenceRange?.category ?? "Other",
    unit: readings[0]?.unit ?? referenceRange?.unit ?? "",
    referenceRange: referenceRange
      ? { low: referenceRange.low, high: referenceRange.high }
      : null,
    summary,
    readings,
  };
}

export type CreateManualReadingInput = {
  biomarkerKey: string;
  biomarkerName: string;
  value: number;
  unit: string;
  readingDate: string;
  notes?: string | null;
};

export async function createManualReading(
  userId: string,
  input: CreateManualReadingInput,
): Promise<BiomarkerReading> {
  const profile = await getProfileByUserId(userId);
  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const referenceRange = await getAdjustedReferenceRange(
    input.biomarkerKey,
    age,
    profile?.biological_sex ?? null,
  );

  const status = referenceRange
    ? determineStatus(input.value, referenceRange)
    : null;

  const { data, error } = await supabaseAdmin
    .from("biomarker_readings")
    .insert({
      user_id: userId,
      lab_report_id: null,
      biomarker_key: input.biomarkerKey,
      biomarker_name: input.biomarkerName,
      value: input.value,
      unit: input.unit,
      reference_range_low: referenceRange?.low ?? null,
      reference_range_high: referenceRange?.high ?? null,
      reference_range_text: null,
      status,
      reading_date: input.readingDate,
      source: "manual",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new LabError(error?.message ?? "Failed to create reading", 500, "INTERNAL_ERROR");
  }

  return mapReading(data as BiomarkerReadingRow);
}

export async function listUnreadAlerts(userId: string): Promise<BiomarkerAlert[]> {
  const { data, error } = await supabaseAdmin
    .from("biomarker_alerts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new LabError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    biomarkerKey: row.biomarker_key,
    alertType: row.alert_type,
    previousValue: row.previous_value,
    newValue: row.new_value,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function markAlertRead(userId: string, alertId: string): Promise<BiomarkerAlert> {
  const { data, error } = await supabaseAdmin
    .from("biomarker_alerts")
    .update({ is_read: true })
    .eq("id", alertId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new LabError(error?.message ?? "Alert not found", 404, "ALERT_NOT_FOUND");
  }

  return {
    id: data.id,
    biomarkerKey: data.biomarker_key,
    alertType: data.alert_type,
    previousValue: data.previous_value,
    newValue: data.new_value,
    previousStatus: data.previous_status,
    newStatus: data.new_status,
    isRead: data.is_read,
    createdAt: data.created_at,
  };
}

function findReadingForPoint(
  readings: BiomarkerReading[],
  point: BiomarkerReadingPoint,
): BiomarkerReading | null {
  return (
    readings.find(
      (reading) =>
        reading.value === point.value &&
        reading.readingDate === point.readingDate &&
        reading.createdAt === point.createdAt,
    ) ?? null
  );
}

export async function processTrendForBiomarker(
  userId: string,
  biomarkerKey: string,
): Promise<void> {
  const readings = await fetchReadingsForBiomarker(userId, biomarkerKey, 10);

  if (readings.length === 0) {
    return;
  }

  const profile = await getProfileByUserId(userId);
  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const referenceRange = await getAdjustedReferenceRange(
    biomarkerKey,
    age,
    profile?.biological_sex ?? null,
  );

  const points: BiomarkerReadingPoint[] = readings.map((reading) => ({
    value: reading.value,
    readingDate: reading.readingDate,
    createdAt: reading.createdAt,
  }));

  const summary = buildTrendSummary(points, referenceRange);
  const sortedDesc = [...points].sort((left, right) =>
    compareReadingPoints(left, right, "desc"),
  );
  const latestPoint = sortedDesc[0]!;
  const previousPoint = sortedDesc[1] ?? null;
  const latestReading = findReadingForPoint(readings, latestPoint);
  const previousReading = previousPoint ? findReadingForPoint(readings, previousPoint) : null;

  if (summary?.status && latestReading) {
    await supabaseAdmin
      .from("biomarker_readings")
      .update({ status: summary.status })
      .eq("id", latestReading.id);
  }

  const trend = calculateTrend(points);
  const alerts: Array<{
    user_id: string;
    biomarker_key: string;
    alert_type: "status_change" | "large_delta";
    previous_value: number | null;
    new_value: number;
    previous_status: BiomarkerStatus | null;
    new_status: BiomarkerStatus | null;
  }> = [];

  const latestValue = summary?.latestValue ?? latestPoint.value;
  const previousValue = summary?.previousValue ?? previousPoint?.value ?? null;

  let statusChangeFired = false;

  if (
    previousReading &&
    summary?.status &&
    previousReading.status &&
    previousReading.status !== summary.status
  ) {
    alerts.push({
      user_id: userId,
      biomarker_key: biomarkerKey,
      alert_type: "status_change",
      previous_value: previousValue,
      new_value: latestValue,
      previous_status: previousReading.status,
      new_status: summary.status,
    });
    statusChangeFired = true;
  }

  if (
    !statusChangeFired &&
    trend.deltaPct !== null &&
    Math.abs(trend.deltaPct) >= env.LAB_TREND_DELTA_ALERT_PCT &&
    previousValue !== null
  ) {
    alerts.push({
      user_id: userId,
      biomarker_key: biomarkerKey,
      alert_type: "large_delta",
      previous_value: previousValue,
      new_value: latestValue,
      previous_status: previousReading?.status ?? null,
      new_status: summary?.status ?? null,
    });
  }

  if (alerts.length > 0) {
    const dedupeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentDuplicate } = await supabaseAdmin
      .from("biomarker_alerts")
      .select("id")
      .eq("user_id", userId)
      .eq("biomarker_key", biomarkerKey)
      .eq("is_read", false)
      .eq("new_value", latestValue)
      .gte("created_at", dedupeSince)
      .limit(1);

    if (!recentDuplicate || recentDuplicate.length === 0) {
      const { error } = await supabaseAdmin.from("biomarker_alerts").insert(alerts);

      if (error) {
        throw new LabError(error.message, 500, "INTERNAL_ERROR");
      }

      const biomarkerName =
        latestReading?.biomarkerName ??
        biomarkerKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

      await notifyFamilyCaregivers({
        subjectUserId: userId,
        biomarkerKey,
        biomarkerName,
        alertType: alerts[0]!.alert_type,
        newValue: latestValue,
        newStatus: alerts[0]!.new_status,
      });
    }
  }

  await cacheDel(insightCacheKey(userId, biomarkerKey));
}

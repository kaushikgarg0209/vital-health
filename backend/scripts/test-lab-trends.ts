import "dotenv/config";
process.env.CHAT_QUERY_EXPANSION_ENABLED = "false";

import { supabaseAdmin } from "../src/config/supabase.js";
import { cacheDel, cacheGet, insightCacheKey } from "../src/services/cache/cacheService.js";
import { generateInsight } from "../src/services/lab/insightService.js";
import { processTrendForBiomarker } from "../src/services/lab/labService.js";
import {
  calculateTrend,
  determineStatus,
  type BiomarkerReadingPoint,
} from "../src/services/lab/trendAnalysis.js";
import { getProfileByUserId } from "../src/services/profileService.js";
import { getAdjustedReferenceRange, calculateAge } from "../src/services/lab/referenceRangeService.js";
import { isGeminiRateLimitError } from "../src/services/ai/geminiRetry.js";
import { redisConnection } from "../src/config/redis.js";

async function getTestUserId(): Promise<string> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!profile) {
    throw new Error("No profiles found — register a user first.");
  }

  return profile.id;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

async function seedGlucoseReadings(userId: string): Promise<void> {
  const readings = [
    { value: 92, reading_date: daysAgo(90) },
    { value: 98, reading_date: daysAgo(60) },
    { value: 108, reading_date: daysAgo(30) },
  ];

  for (const reading of readings) {
    const { data: existing } = await supabaseAdmin
      .from("biomarker_readings")
      .select("id")
      .eq("user_id", userId)
      .eq("biomarker_key", "glucose")
      .eq("reading_date", reading.reading_date)
      .eq("source", "manual")
      .maybeSingle();

    if (existing) {
      continue;
    }

    const { error } = await supabaseAdmin.from("biomarker_readings").insert({
      user_id: userId,
      lab_report_id: null,
      biomarker_key: "glucose",
      biomarker_name: "Glucose (Fasting)",
      value: reading.value,
      unit: "mg/dL",
      reference_range_low: 70,
      reference_range_high: 99,
      reference_range_text: null,
      status: reading.value <= 99 ? "normal" : "borderline",
      reading_date: reading.reading_date,
      source: "manual",
      notes: "Phase 6 test seed",
    });

    if (error) {
      throw error;
    }
  }
}

async function main(): Promise<void> {
  console.log("=== Phase 6 Lab Trends Test ===\n");

  const userId = await getTestUserId();
  console.log(`Using user: ${userId}\n`);

  await seedGlucoseReadings(userId);

  const points: BiomarkerReadingPoint[] = [
    { value: 92, readingDate: daysAgo(90) },
    { value: 98, readingDate: daysAgo(60) },
    { value: 108, readingDate: daysAgo(30) },
  ];

  const trend = calculateTrend(points);
  console.log("Trend math (glucose):");
  console.log(`  direction: ${trend.direction}`);
  console.log(`  slope: ${trend.slope.toFixed(4)}`);
  console.log(`  deltaPct: ${trend.deltaPct?.toFixed(1) ?? "n/a"}%\n`);

  const profile = await getProfileByUserId(userId);
  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const referenceRange = await getAdjustedReferenceRange(
    "glucose",
    age,
    profile?.biological_sex ?? null,
  );

  if (referenceRange) {
    const status = determineStatus(108, referenceRange);
    console.log(`Status for 108 mg/dL glucose: ${status}\n`);
  }

  console.log("Running trend worker logic inline...");
  await processTrendForBiomarker(userId, "glucose");
  console.log("Trend processing complete.\n");

  const cacheKey = insightCacheKey(userId, "glucose");
  await cacheDel(cacheKey);

  console.log("Generating insight (cache miss)...");
  try {
    const startMiss = Date.now();
    const miss = await generateInsight(userId, "glucose");
    const missMs = Date.now() - startMiss;
    console.log(`  cached: ${miss.cached}, took ${missMs}ms`);
    console.log(`  preview: ${miss.insight.slice(0, 120)}...\n`);

    console.log("Generating insight (cache hit)...");
    const startHit = Date.now();
    const hit = await generateInsight(userId, "glucose");
    const hitMs = Date.now() - startHit;
    console.log(`  cached: ${hit.cached}, took ${hitMs}ms\n`);

    const cached = await cacheGet<{ insight: string }>(cacheKey);
    console.log(`Redis cache key present: ${cached !== null}\n`);
  } catch (error) {
    if (isGeminiRateLimitError(error)) {
      console.warn("Skipping Gemini insight checks — rate limit exceeded after retries.");
    } else {
      throw error;
    }
  }

  const { data: alerts } = await supabaseAdmin
    .from("biomarker_alerts")
    .select("*")
    .eq("user_id", userId)
    .eq("biomarker_key", "glucose")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log(`Recent glucose alerts: ${alerts?.length ?? 0}`);
  for (const alert of alerts ?? []) {
    console.log(`  - ${alert.alert_type}: ${alert.previous_value} → ${alert.new_value}`);
  }

  console.log("\n=== Lab trends test complete ===");
}

main()
  .catch((error) => {
    console.error("Lab trends test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await redisConnection.quit();
  });

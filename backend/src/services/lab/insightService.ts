import { env } from "../../config/env.js";
import { generateText } from "../ai/geminiJson.js";
import { cacheGet, cacheSet, insightCacheKey } from "../cache/cacheService.js";
import { getProfileByUserId } from "../profileService.js";
import { calculateAge, getAdjustedReferenceRange } from "./referenceRangeService.js";
import { buildTrendSummary, type BiomarkerReadingPoint } from "./trendAnalysis.js";
import { fetchReadingsForBiomarker } from "./labService.js";

export type BiomarkerInsight = {
  biomarkerKey: string;
  insight: string;
  cached: boolean;
  generatedAt: string;
};

function buildInsightPrompt(input: {
  displayName: string;
  unit: string;
  readings: BiomarkerReadingPoint[];
  referenceLow: number | null;
  referenceHigh: number | null;
  trendDirection: string;
  deltaPct: number | null;
  status: string | null;
}): string {
  const readingLines = input.readings
    .slice(0, 8)
    .map((reading) => `- ${reading.readingDate}: ${reading.value} ${input.unit}`)
    .join("\n");

  const rangeText =
    input.referenceLow !== null && input.referenceHigh !== null
      ? `${input.referenceLow}–${input.referenceHigh} ${input.unit}`
      : input.referenceHigh !== null
        ? `≤ ${input.referenceHigh} ${input.unit}`
        : input.referenceLow !== null
          ? `≥ ${input.referenceLow} ${input.unit}`
          : "not available";

  return `You are a health education assistant helping a user understand their lab biomarker trends.

Rules:
- Use plain language (2-4 short paragraphs max).
- Do NOT diagnose or prescribe treatment.
- Reference only the user's own readings provided below.
- Explain what the trend direction might mean in general educational terms.
- If data is limited (only 1 reading), say a trend cannot be established yet.
- End with a reminder to discuss results with their clinician.

Biomarker: ${input.displayName}
Reference range: ${rangeText}
Computed status: ${input.status ?? "unknown"}
Trend direction: ${input.trendDirection}
Change from previous reading: ${input.deltaPct !== null ? `${input.deltaPct.toFixed(1)}%` : "n/a"}

Recent readings (newest first):
${readingLines}

Write a helpful, calm insight for the user.`;
}

export async function generateInsight(
  userId: string,
  biomarkerKey: string,
): Promise<BiomarkerInsight> {
  const cacheKey = insightCacheKey(userId, biomarkerKey);
  const cached = await cacheGet<Omit<BiomarkerInsight, "cached">>(cacheKey);

  if (cached) {
    return { ...cached, cached: true };
  }

  const [readings, profile] = await Promise.all([
    fetchReadingsForBiomarker(userId, biomarkerKey),
    getProfileByUserId(userId),
  ]);

  if (readings.length === 0) {
    return {
      biomarkerKey,
      insight:
        "No readings found for this biomarker yet. Upload a lab report or log a value manually to see insights.",
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  }

  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const referenceRange = await getAdjustedReferenceRange(
    biomarkerKey,
    age,
    profile?.biological_sex ?? null,
  );

  const points: BiomarkerReadingPoint[] = readings.map((reading) => ({
    value: reading.value,
    readingDate: reading.readingDate,
  }));

  const summary = buildTrendSummary(points, referenceRange);

  const prompt = buildInsightPrompt({
    displayName: referenceRange?.displayName ?? readings[0]!.biomarkerName,
    unit: readings[0]!.unit,
    readings: points,
    referenceLow: referenceRange?.low ?? null,
    referenceHigh: referenceRange?.high ?? null,
    trendDirection: summary?.trend.direction ?? "stable",
    deltaPct: summary?.trend.deltaPct ?? null,
    status: summary?.status ?? null,
  });

  const insightText = await generateText(env.GEMINI_INSIGHT_MODEL, prompt);
  const generatedAt = new Date().toISOString();

  const payload = {
    biomarkerKey,
    insight: insightText,
    generatedAt,
  };

  await cacheSet(cacheKey, payload, env.LAB_INSIGHT_CACHE_TTL_SECONDS);

  return {
    ...payload,
    cached: false,
  };
}

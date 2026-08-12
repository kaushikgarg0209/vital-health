import { supabaseAdmin } from "../../config/supabase.js";
import type { BiologicalSex } from "../../types/profile.js";

export type ReferenceRange = {
  low: number | null;
  high: number | null;
  unit: string;
  displayName: string;
  category: string;
};

type ReferenceRow = {
  biomarker_key: string;
  display_name: string;
  category: string;
  unit: string;
  biological_sex: BiologicalSex | null;
  age_min: number | null;
  age_max: number | null;
  reference_low: number | null;
  reference_high: number | null;
};

export function calculateAge(dateOfBirth: string): number | null {
  const birth = new Date(`${dateOfBirth}T00:00:00.000Z`);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function matchesAge(row: ReferenceRow, age: number | null): boolean {
  if (age === null) {
    return row.age_min === null && row.age_max === null;
  }

  const minOk = row.age_min === null || age >= row.age_min;
  const maxOk = row.age_max === null || age <= row.age_max;

  return minOk && maxOk;
}

function matchesSex(row: ReferenceRow, sex: BiologicalSex | null): boolean {
  if (row.biological_sex === null) {
    return true;
  }

  return row.biological_sex === sex;
}

function rowSpecificity(row: ReferenceRow): number {
  let score = 0;

  if (row.biological_sex !== null) {
    score += 2;
  }

  if (row.age_min !== null) {
    score += 1;
  }

  if (row.age_max !== null) {
    score += 1;
  }

  const ageSpan =
    row.age_max !== null && row.age_min !== null ? row.age_max - row.age_min : Number.MAX_SAFE_INTEGER;

  return score * 1000 - ageSpan;
}

function toReferenceRange(row: ReferenceRow): ReferenceRange {
  return {
    low: row.reference_low !== null ? Number(row.reference_low) : null,
    high: row.reference_high !== null ? Number(row.reference_high) : null,
    unit: row.unit,
    displayName: row.display_name,
    category: row.category,
  };
}

export async function getAdjustedReferenceRange(
  biomarkerKey: string,
  age: number | null,
  sex: BiologicalSex | null,
): Promise<ReferenceRange | null> {
  const { data, error } = await supabaseAdmin
    .from("biomarker_reference")
    .select(
      "biomarker_key, display_name, category, unit, biological_sex, age_min, age_max, reference_low, reference_high",
    )
    .eq("biomarker_key", biomarkerKey);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const candidates = (data as ReferenceRow[]).filter(
    (row) => matchesAge(row, age) && matchesSex(row, sex),
  );

  if (candidates.length === 0) {
    const fallback = (data as ReferenceRow[]).find((row) => row.biological_sex === null);
    return fallback ? toReferenceRange(fallback) : null;
  }

  candidates.sort((left, right) => rowSpecificity(right) - rowSpecificity(left));

  return toReferenceRange(candidates[0]!);
}

export async function listReferenceCatalog(): Promise<
  Array<{
    biomarkerKey: string;
    displayName: string;
    category: string;
    unit: string;
  }>
> {
  const { data, error } = await supabaseAdmin
    .from("biomarker_reference")
    .select("biomarker_key, display_name, category, unit, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const seen = new Set<string>();
  const catalog: Array<{
    biomarkerKey: string;
    displayName: string;
    category: string;
    unit: string;
  }> = [];

  for (const row of data ?? []) {
    if (seen.has(row.biomarker_key)) {
      continue;
    }

    seen.add(row.biomarker_key);
    catalog.push({
      biomarkerKey: row.biomarker_key,
      displayName: row.display_name,
      category: row.category,
      unit: row.unit,
    });
  }

  return catalog;
}

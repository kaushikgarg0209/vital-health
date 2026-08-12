const BIOMARKER_ALIASES: Record<string, string> = {
  glucose: "glucose",
  "fasting glucose": "glucose",
  "blood glucose": "glucose",
  "fasting blood glucose": "glucose",
  "blood sugar": "glucose",
  "blood sugar level": "glucose",
  fbs: "glucose",
  fbg: "glucose",
  hba1c: "hba1c",
  "hb a1c": "hba1c",
  "glycated hemoglobin": "hba1c",
  "glycosylated hemoglobin": "hba1c",
  ldl: "ldl_cholesterol",
  "ldl cholesterol": "ldl_cholesterol",
  "ldl-c": "ldl_cholesterol",
  hdl: "hdl_cholesterol",
  "hdl cholesterol": "hdl_cholesterol",
  "hdl-c": "hdl_cholesterol",
  "total cholesterol": "total_cholesterol",
  cholesterol: "total_cholesterol",
  triglycerides: "triglycerides",
  tg: "triglycerides",
  "non-hdl cholesterol": "non_hdl_cholesterol",
  "non hdl cholesterol": "non_hdl_cholesterol",
  "apolipoprotein b": "apolipoprotein_b",
  apob: "apolipoprotein_b",
  "lipoprotein(a)": "lipoprotein_a",
  "lipoprotein a": "lipoprotein_a",
  lpa: "lipoprotein_a",
  creatinine: "creatinine",
  bun: "bun",
  "blood urea nitrogen": "bun",
  egfr: "egfr",
  "estimated gfr": "egfr",
  "uric acid": "uric_acid",
  alt: "alt",
  "alanine aminotransferase": "alt",
  sgpt: "alt",
  ast: "ast",
  "aspartate aminotransferase": "ast",
  sgot: "ast",
  alp: "alp",
  "alkaline phosphatase": "alp",
  "total bilirubin": "bilirubin_total",
  bilirubin: "bilirubin_total",
  albumin: "albumin",
  ggt: "ggt",
  "gamma gt": "ggt",
  tsh: "tsh",
  "thyroid stimulating hormone": "tsh",
  "free t4": "free_t4",
  "free thyroxine": "free_t4",
  "free t3": "free_t3",
  hemoglobin: "hemoglobin",
  hgb: "hemoglobin",
  hb: "hemoglobin",
  hematocrit: "hematocrit",
  hct: "hematocrit",
  wbc: "wbc",
  "white blood cell count": "wbc",
  "white blood cells": "wbc",
  rbc: "rbc",
  "red blood cell count": "rbc",
  "red blood cells": "rbc",
  platelets: "platelets",
  plt: "platelets",
  "vitamin d": "vitamin_d",
  "vitamin d 25-hydroxy": "vitamin_d",
  "25-hydroxyvitamin d": "vitamin_d",
  "vitamin b12": "vitamin_b12",
  b12: "vitamin_b12",
  ferritin: "ferritin",
  iron: "iron",
  crp: "crp",
  "c-reactive protein": "crp",
  "c reactive protein": "crp",
  esr: "esr",
  "erythrocyte sedimentation rate": "esr",
  sodium: "sodium",
  na: "sodium",
  potassium: "potassium",
  k: "potassium",
  calcium: "calcium",
  ca: "calcium",
  insulin: "insulin",
  "fasting insulin": "insulin",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function resolveBiomarkerKey(testName: string, biomarkerKey?: string | null): string {
  if (biomarkerKey?.trim()) {
    return normalizeKey(biomarkerKey);
  }

  const normalizedName = testName.trim().toLowerCase();
  const alias = BIOMARKER_ALIASES[normalizedName];

  if (alias) {
    return alias;
  }

  return slugify(testName);
}

export function detectBiomarkerKeysInText(text: string): string[] {
  const normalized = text.toLowerCase();
  const found = new Set<string>();

  const entries = Object.entries(BIOMARKER_ALIASES).sort(
    (left, right) => right[0].length - left[0].length,
  );

  for (const [alias, key] of entries) {
    const pattern = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

    if (pattern.test(normalized)) {
      found.add(key);
    }
  }

  return [...found];
}

const BIOMARKER_ALIASES: Record<string, string> = {
  glucose: "glucose",
  "fasting glucose": "glucose",
  "blood glucose": "glucose",
  "fasting blood glucose": "glucose",
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
  creatinine: "creatinine",
  tsh: "tsh",
  "thyroid stimulating hormone": "tsh",
  "vitamin d": "vitamin_d",
  "vitamin d 25-hydroxy": "vitamin_d",
  "25-hydroxyvitamin d": "vitamin_d",
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

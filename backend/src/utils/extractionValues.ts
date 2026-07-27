export type BiomarkerStatus = "normal" | "borderline" | "concerning" | "critical";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseExtractionDate(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (!DATE_PATTERN.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
}

export function parseExtractionNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

export function mapBiomarkerStatus(
  status: string | null | undefined,
): BiomarkerStatus | null {
  if (!status || status === "unknown") {
    return null;
  }

  if (
    status === "normal" ||
    status === "borderline" ||
    status === "concerning" ||
    status === "critical"
  ) {
    return status;
  }

  return null;
}

export function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

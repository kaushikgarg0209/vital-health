type CoachFeedback = {
  feedback: string;
  adjustment: string | null;
};

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractBalancedJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }

  return null;
}

function tryParseAdaptationJson(raw: string): CoachFeedback | null {
  const candidates = [raw, extractBalancedJsonObject(stripMarkdownFences(raw))].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        feedback?: string;
        adjustment?: string;
      };

      if (typeof parsed.feedback === "string" && parsed.feedback.trim()) {
        return {
          feedback: parsed.feedback.trim(),
          adjustment:
            typeof parsed.adjustment === "string" && parsed.adjustment.trim()
              ? parsed.adjustment.trim()
              : null,
        };
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

export function parseCoachFeedback(
  aiFeedback: string | null | undefined,
  adjustedTargets: Record<string, unknown> | null | undefined,
): CoachFeedback | null {
  if (!aiFeedback?.trim()) {
    return null;
  }

  const adjustmentFromTargets =
    typeof adjustedTargets?.adjustment === "string" && adjustedTargets.adjustment.trim()
      ? adjustedTargets.adjustment.trim()
      : null;

  const parsedFromFeedback = tryParseAdaptationJson(aiFeedback);
  if (parsedFromFeedback) {
    return {
      feedback: parsedFromFeedback.feedback,
      adjustment: parsedFromFeedback.adjustment ?? adjustmentFromTargets,
    };
  }

  return {
    feedback: aiFeedback.trim(),
    adjustment: adjustmentFromTargets,
  };
}

export function isPlanStale(
  preferencesUpdatedAt: string | undefined,
  planGeneratedAt: string | undefined,
): boolean {
  if (!preferencesUpdatedAt || !planGeneratedAt) {
    return false;
  }

  return new Date(preferencesUpdatedAt).getTime() > new Date(planGeneratedAt).getTime();
}

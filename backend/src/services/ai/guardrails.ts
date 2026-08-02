const EMERGENCY_PATTERNS: RegExp[] = [
  /\bheart attack\b/i,
  /\bchest pain\b/i,
  /\bcan(?:'|no)?t breathe\b/i,
  /\bcan(?:'|no)?t breath\b/i,
  /\bstroke\b/i,
  /\bsuicid(e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bsevere bleeding\b/i,
  /\bunconscious\b/i,
  /\bnot breathing\b/i,
  /\boverdose\b/i,
  /\banaphyla(?:xis|ctic)\b/i,
];

const EMERGENCY_RESPONSE =
  "This sounds like a medical emergency. Please call your local emergency number immediately (such as 911 in the US) or go to the nearest emergency room. I cannot provide emergency medical care.";

export type GuardrailResult = {
  override: boolean;
  response?: string;
};

export function applyGuardrails(message: string): GuardrailResult {
  const normalized = message.trim();

  if (!normalized) {
    return { override: false };
  }

  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        override: true,
        response: EMERGENCY_RESPONSE,
      };
    }
  }

  return { override: false };
}

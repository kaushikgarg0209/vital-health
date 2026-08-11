export const GEMINI_RATE_LIMIT_MESSAGE =
  "The AI service is temporarily busy. Please wait a moment and try again.";

export class GeminiRateLimitError extends Error {
  readonly statusCode = 429;
  readonly code = "RATE_LIMIT_EXCEEDED";

  constructor(message = GEMINI_RATE_LIMIT_MESSAGE) {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const record = error as Record<string, unknown>;

  if (typeof record.status === "number") {
    return record.status;
  }

  const cause = record.cause;

  if (typeof cause === "object" && cause !== null && typeof (cause as Record<string, unknown>).status === "number") {
    return (cause as Record<string, unknown>).status as number;
  }

  return undefined;
}

function readMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function parseRetryDelayMs(message: string): number | null {
  const retryMatch = message.match(/retry in ([0-9.]+)s/i);

  if (retryMatch?.[1]) {
    const seconds = Number(retryMatch[1]);

    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  const retryDelayMatch = message.match(/"retryDelay"\s*:\s*"(\d+)s"/i);

  if (retryDelayMatch?.[1]) {
    const seconds = Number(retryDelayMatch[1]);

    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }

  return null;
}

export function isGeminiRateLimitError(error: unknown): boolean {
  const status = readStatus(error);
  const message = readMessage(error).toLowerCase();

  return (
    error instanceof GeminiRateLimitError ||
    status === 429 ||
    message.includes("resource_exhausted") ||
    message.includes('"code": 429') ||
    message.includes("quota exceeded") ||
    message.includes("rate limit")
  );
}

export function toGeminiRateLimitError(error: unknown): GeminiRateLimitError {
  if (error instanceof GeminiRateLimitError) {
    return error;
  }

  return new GeminiRateLimitError();
}

export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 20_000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isGeminiRateLimitError(error) || attempt === maxAttempts) {
        throw error;
      }

      const hintedDelay = parseRetryDelayMs(readMessage(error));
      const delayMs = hintedDelay ?? baseDelayMs * attempt;

      console.warn(
        `Gemini rate limit hit (attempt ${attempt}/${maxAttempts}). Retrying in ${Math.round(delayMs / 1000)}s...`,
      );

      await sleep(delayMs);
    }
  }

  throw lastError;
}

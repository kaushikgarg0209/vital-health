import type { Part } from "@google/genai";
import type { ZodType } from "zod";
import { geminiClient } from "../../config/gemini.js";
import type { DocumentInputPart } from "../../utils/documentInput.js";
import { JSON_CORRECTION_PROMPT } from "./documentPrompts.js";
import { withGeminiRetry } from "./geminiRetry.js";

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export type GenerateJsonOptions = {
  maxOutputTokens?: number;
};

function toContentParts(parts: DocumentInputPart[]): Part[] {
  return parts.map((part) => ({
    inlineData: {
      mimeType: part.inlineData.mimeType,
      data: part.inlineData.data,
    },
  }));
}

function extractResponseText(response: { text?: string }): string {
  const text = response.text?.trim();

  if (!text) {
    throw new GeminiError("Gemini returned an empty response");
  }

  return text;
}

function stripMarkdownFences(raw: string): string {
  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return raw.trim();
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
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
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
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function extractJsonPayload(raw: string): string {
  const trimmed = stripMarkdownFences(raw);
  const extracted = extractBalancedJsonObject(trimmed);
  return extracted ?? trimmed;
}

function uniqueCandidates(candidates: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function parseJsonResponse(raw: string): unknown {
  const candidates = uniqueCandidates([raw, extractJsonPayload(raw)]);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch (error) {
      lastError = error;
    }
  }

  throw new GeminiError("Gemini response was not valid JSON", lastError);
}

async function callGeminiJson(
  model: string,
  contents: Part[],
  prompt: string,
  options?: GenerateJsonOptions,
): Promise<string> {
  try {
    const response = await withGeminiRetry(() =>
      geminiClient.models.generateContent({
        model,
        contents: [...contents, { text: prompt }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          ...(options?.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
        },
      }),
    );

    return extractResponseText(response);
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }

    throw new GeminiError(
      error instanceof Error ? error.message : "Gemini request failed",
      error,
    );
  }
}

export async function generateJson<T>(
  model: string,
  parts: DocumentInputPart[],
  prompt: string,
  schema: ZodType<T>,
  schemaDescription: string,
  options?: GenerateJsonOptions,
): Promise<T> {
  const contents = toContentParts(parts);

  const firstRaw = await callGeminiJson(model, contents, prompt, options);
  const firstParsed = schema.safeParse(parseJsonResponse(firstRaw));

  if (firstParsed.success) {
    return firstParsed.data;
  }

  const correctionPrompt = JSON_CORRECTION_PROMPT(
    schemaDescription,
    firstParsed.error.issues[0]?.message ?? "Schema validation failed",
  );

  const retryRaw = await callGeminiJson(
    model,
    contents,
    `${prompt}\n\n${correctionPrompt}`,
    options,
  );
  const retryParsed = schema.safeParse(parseJsonResponse(retryRaw));

  if (retryParsed.success) {
    return retryParsed.data;
  }

  throw new GeminiError(
    `Gemini JSON validation failed: ${retryParsed.error.issues[0]?.message ?? "Unknown validation error"}`,
    retryParsed.error,
  );
}

export async function generateText(
  model: string,
  prompt: string,
): Promise<string> {
  try {
    const response = await withGeminiRetry(() =>
      geminiClient.models.generateContent({
        model,
        contents: prompt,
      }),
    );

    return extractResponseText(response);
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }

    throw new GeminiError(
      error instanceof Error ? error.message : "Gemini request failed",
      error,
    );
  }
}

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

function parseJsonResponse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new GeminiError("Gemini response was not valid JSON", error);
  }
}

async function callGeminiJson(model: string, contents: Part[], prompt: string): Promise<string> {
  try {
    const response = await withGeminiRetry(() =>
      geminiClient.models.generateContent({
        model,
        contents: [...contents, { text: prompt }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
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
): Promise<T> {
  const contents = toContentParts(parts);

  const firstRaw = await callGeminiJson(model, contents, prompt);
  const firstParsed = schema.safeParse(parseJsonResponse(firstRaw));

  if (firstParsed.success) {
    return firstParsed.data;
  }

  const correctionPrompt = JSON_CORRECTION_PROMPT(
    schemaDescription,
    firstParsed.error.issues[0]?.message ?? "Schema validation failed",
  );

  const retryRaw = await callGeminiJson(model, contents, `${prompt}\n\n${correctionPrompt}`);
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

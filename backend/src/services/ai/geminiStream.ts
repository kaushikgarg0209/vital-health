import { geminiClient } from "../../config/gemini.js";
import { GeminiError } from "./geminiJson.js";

function extractChunkText(chunk: { text?: string }): string {
  return chunk.text ?? "";
}

export async function* streamGenerateText(model: string, prompt: string): AsyncGenerator<string> {
  try {
    const stream = await geminiClient.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    for await (const chunk of stream) {
      const text = extractChunkText(chunk);

      if (text) {
        yield text;
      }
    }
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }

    throw new GeminiError(
      error instanceof Error ? error.message : "Gemini streaming request failed",
      error,
    );
  }
}

export async function generateTextNonStreaming(model: string, prompt: string): Promise<string> {
  let fullText = "";

  for await (const token of streamGenerateText(model, prompt)) {
    fullText += token;
  }

  return fullText.trim();
}

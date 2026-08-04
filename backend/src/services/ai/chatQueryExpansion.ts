import { z } from "zod";
import { CHAT_MODEL, CHAT_QUERY_EXPANSION_ENABLED, geminiClient } from "../../config/gemini.js";
import type { Message } from "../../types/chat.js";

const expansionSchema = z.object({
  queries: z.array(z.string().min(1)).min(1).max(4),
});

export async function expandRetrievalQueries(
  userMessage: string,
  history: Message[] = [],
): Promise<string[]> {
  if (!CHAT_QUERY_EXPANSION_ENABLED) {
    return [userMessage];
  }

  const lastUserTurn = [...history].reverse().find((message) => message.role === "user")?.content;
  const contextHint =
    lastUserTurn && lastUserTurn !== userMessage
      ? `\nPrevious user message: ${lastUserTurn}`
      : "";

  const prompt = `You help search a user's personal health records. Given the user's question, output 2-3 short search queries that would find the most relevant document text chunks in their medical records. Focus on medical terms, test names, biomarkers, medications, and document types. Do not answer the question.

User question: ${userMessage}${contextHint}

Respond as JSON: { "queries": ["...", "..."] }`;

  try {
    const response = await geminiClient.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      return [userMessage];
    }

    const parsed = expansionSchema.parse(JSON.parse(text));
    const uniqueQueries = [...new Set([userMessage, ...parsed.queries.map((query) => query.trim())])];

    return uniqueQueries.slice(0, 4);
  } catch (error) {
    console.error("Chat query expansion failed, using original message:", error);
    return [userMessage];
  }
}

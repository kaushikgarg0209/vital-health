import { env } from "../../config/env.js";
import { CHAT_HISTORY_LIMIT } from "../../config/gemini.js";
import type { Message, RetrievedChunkContext } from "../../types/chat.js";
import type { Profile } from "../../types/profile.js";

export type BuildPromptInput = {
  profile: Profile | null;
  retrievedChunks: RetrievedChunkContext[];
  history: Message[];
  userMessage: string;
};

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function buildSystemPrompt(): string {
  return `You are Vital, a personal health advocate. You help users understand their own medical records.

Rules:
- Never diagnose conditions or prescribe treatment.
- Base factual claims about the user's health on the retrieved records provided below.
- When you use information from a record, mention the source file name.
- If the answer is not in the retrieved records, say clearly: "I don't have that information in your records."
- Use plain language. Be concise, supportive, and accurate.
- For clinical decisions, encourage the user to consult their doctor.`;
}

export function buildProfileSection(profile: Profile | null): string {
  if (!profile) {
    return "No profile information available.";
  }

  const age = calculateAge(profile.date_of_birth);
  const lines = [
    `Name: ${profile.full_name}`,
    age != null ? `Age: ${age}` : null,
    profile.biological_sex ? `Biological sex: ${profile.biological_sex}` : null,
    profile.blood_type ? `Blood type: ${profile.blood_type}` : null,
    profile.known_conditions.length > 0
      ? `Known conditions: ${profile.known_conditions.join(", ")}`
      : "Known conditions: none listed",
    profile.allergies.length > 0
      ? `Allergies: ${profile.allergies.join(", ")}`
      : "Allergies: none listed",
    profile.current_medications.length > 0
      ? `Current medications: ${profile.current_medications.join(", ")}`
      : "Current medications: none listed",
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildRetrievedContextSection(chunks: RetrievedChunkContext[]): string {
  if (chunks.length === 0) {
    return "No relevant records were retrieved for this question.";
  }

  return chunks
    .map(
      (chunk, index) =>
        `[Record ${index + 1} — Source: ${chunk.fileName}, chunk ${chunk.chunkIndex}, similarity ${chunk.similarity.toFixed(2)}]\n${chunk.content}`,
    )
    .join("\n\n");
}

export function buildHistorySection(history: Message[]): string {
  if (history.length === 0) {
    return "No prior messages in this conversation.";
  }

  return history
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "Assistant";
      return `${speaker}: ${message.content}`;
    })
    .join("\n");
}

export function buildPrompt(input: BuildPromptInput): string {
  const sections = [
    "[SYSTEM]",
    buildSystemPrompt(),
    "",
    "[USER PROFILE]",
    buildProfileSection(input.profile),
    "",
    "[RETRIEVED RECORDS]",
    buildRetrievedContextSection(input.retrievedChunks),
    "",
    "[CONVERSATION HISTORY]",
    buildHistorySection(input.history),
    "",
    "[CURRENT QUESTION]",
    `User: ${input.userMessage}`,
    "",
    "Assistant:",
  ];

  const prompt = sections.join("\n");

  if (env.NODE_ENV === "development") {
    console.log("\n--- RAG PROMPT ---\n");
    console.log(prompt);
    console.log("\n--- END RAG PROMPT ---\n");
  }

  return prompt;
}

export function getHistoryLimit(): number {
  return CHAT_HISTORY_LIMIT;
}

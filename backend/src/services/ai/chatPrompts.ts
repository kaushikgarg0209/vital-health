import { env } from "../../config/env.js";
import { CHAT_HISTORY_LIMIT } from "../../config/gemini.js";
import type { Message, RetrievedChunkContext } from "../../types/chat.js";
import type { Profile } from "../../types/profile.js";

export type BuildPromptInput = {
  profile: Profile | null;
  retrievedChunks: RetrievedChunkContext[];
  structuredFacts: string;
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
  return `You are Vital, a personal health advocate. You help users understand their medical records and health topics in plain language.

Response tiers:
1. USER-SPECIFIC FACTS (from records): Lab values, medications, dates, and other personal data must come from [RETRIEVED RECORDS], [STRUCTURED EXTRACTED DATA], or [CONVERSATION HISTORY]. Cite the source file name when using record data.
2. GENERAL EDUCATION (no record required): Explain standard reference ranges, what biomarkers mean, and general wellness guidance. Label as general information, not a diagnosis.
3. PRACTICAL GUIDANCE (minor issues): For non-emergency questions, you may suggest common OTC options, home remedies, and lifestyle changes (e.g. diet, exercise, sleep, hydration). Before suggesting anything, check [USER PROFILE] for allergies and current medications — warn about interactions and do not suggest anything that clearly conflicts. Always add: "This is AI guidance — confirm with your doctor or pharmacist before starting anything new."
4. SERIOUS CLINICAL DECISIONS (defer): Do not diagnose conditions or tell the user to stop prescribed treatment. For complex or high-risk cases, encourage consulting their doctor.

Follow-up rules:
- Resolve pronouns ("that", "it", "this result") using [CONVERSATION HISTORY].
- Build on prior answers; do not repeat the same record citation word-for-word.
- Combine tiers when helpful: cite their value from records, then explain context, then offer practical next steps if appropriate.
- Use ALL provided context sections ([RETRIEVED RECORDS], [STRUCTURED EXTRACTED DATA], [CONVERSATION HISTORY]). If any section contains data relevant to the question, use it — do not claim data is missing.
- Only say "I don't have that in your records" when ALL sections lack the requested personal fact. Adapt your answer to what was asked (value vs trend vs comparison) using the data available.

Safety:
- Emergency symptoms: tell them to seek immediate care.
- Never replace their doctor for serious decisions.
- Prefer well-known, low-risk suggestions; avoid exotic or unproven treatments.

Use plain language. Be concise, supportive, and accurate.`;
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

export function buildStructuredFactsSection(structuredFacts: string): string {
  return structuredFacts.trim() || "No structured extracted data matched this question.";
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
    "[STRUCTURED EXTRACTED DATA]",
    buildStructuredFactsSection(input.structuredFacts),
    "",
    "[RETRIEVED RECORDS]",
    buildRetrievedContextSection(input.retrievedChunks),
    "",
    "[CONVERSATION HISTORY]",
    buildHistorySection(input.history),
    input.history.length > 0
      ? "Note: When the current question is a follow-up, treat prior assistant messages as established context."
      : null,
    "",
    "[CURRENT QUESTION]",
    `User: ${input.userMessage}`,
    "",
    "Assistant:",
  ].filter((section): section is string => section != null);

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

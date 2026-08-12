import "dotenv/config";
process.env.CHAT_QUERY_EXPANSION_ENABLED = "false";

import { applyGuardrails } from "../src/services/ai/guardrails.js";import { streamChatReply } from "../src/services/ai/chatService.js";
import {
  createConversation,
  getRecentMessages,
  saveMessage,
} from "../src/services/chatService.js";
import { getProfileByUserId } from "../src/services/profileService.js";
import type { ChatSource, Message } from "../src/types/chat.js";
import { supabaseAdmin } from "../src/config/supabase.js";

async function getTestUserId(): Promise<string> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!profile) {
    throw new Error("No profiles found — register a user first.");
  }

  return profile.id;
}

async function collectStreamText(
  userId: string,
  userMessage: string,
  profile: Awaited<ReturnType<typeof getProfileByUserId>>,
  history: Message[],
): Promise<{ text: string; sources: ChatSource[] }> {
  let text = "";
  let sources: ChatSource[] = [];

  for await (const event of streamChatReply({
    userId,
    userMessage,
    profile,
    history,
  })) {
    if (event.kind === "override") {
      text = event.content;
      sources = event.sources;
    }

    if (event.kind === "token") {
      text += event.content;
    }

    if (event.kind === "complete") {
      text = event.content;
      sources = event.sources;
    }
  }

  return { text: text.trim(), sources };
}

function assertFollowUpHelpful(followUpText: string): void {
  const lower = followUpText.toLowerCase();

  if (lower.includes("i don't have that information in your records")) {
    throw new Error("Follow-up incorrectly refused with 'I don't have that information in your records'");
  }

  const hasRangeContext =
    lower.includes("normal") ||
    lower.includes("range") ||
    lower.includes("healthy") ||
    lower.includes("100") ||
    lower.includes("mg/dl");

  if (!hasRangeContext) {
    throw new Error(
      "Follow-up response did not include general glucose range context (normal/range/healthy/100/mg/dL)",
    );
  }
}

function assertGlucoseParaphraseResponse(question: string, response: string): void {
  const lower = response.toLowerCase();

  if (lower.includes("i don't have that information in your records")) {
    throw new Error(`Paraphrase incorrectly refused: "${question}"`);
  }

  if (!lower.includes("95") && !lower.includes("glucose")) {
    throw new Error(`Paraphrase missing core glucose fact: "${question}"`);
  }
}

const GLUCOSE_PARAPHRASES = [
  "What was my glucose value in my recent lab reports?",
  "what is my recent glucose value trend?",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log("Testing guardrails...");
  const guardrail = applyGuardrails("I think I'm having a heart attack");

  if (!guardrail.override) {
    throw new Error("Expected emergency guardrail to override");
  }

  console.log("Guardrail override:", guardrail.response?.slice(0, 80));

  const userId = await getTestUserId();
  const profile = await getProfileByUserId(userId);
  const conversation = await createConversation(userId, "RAG test");

  console.log(`Created conversation ${conversation.id}`);

  const question = "What was my glucose level in my lab report?";
  const history = await getRecentMessages(userId, conversation.id, 6);

  console.log(`Asking: ${question}`);
  const { text, sources } = await collectStreamText(userId, question, profile, history);

  console.log("\nAssistant response:\n", text);
  console.log("\nSources:", JSON.stringify(sources, null, 2));

  await saveMessage(conversation.id, userId, "user", question);
  await saveMessage(conversation.id, userId, "assistant", text, sources);

  if (!text.toLowerCase().includes("95") && !text.toLowerCase().includes("glucose")) {
    console.warn(
      "Warning: response may not reference expected glucose data — ensure embedded lab reports exist.",
    );
  }

  if (sources.length === 0) {
    console.warn("Warning: no sources returned — run npm run backfill:embeddings if needed.");
  }

  const followUpQuestion = "Is that in a healthy range?";
  const followUpHistory = await getRecentMessages(userId, conversation.id, 6);

  console.log(`\nFollow-up: ${followUpQuestion}`);
  const followUp = await collectStreamText(userId, followUpQuestion, profile, followUpHistory);

  console.log("\nFollow-up response:\n", followUp.text);
  assertFollowUpHelpful(followUp.text);

  console.log("\nTesting glucose paraphrase parity...");
  for (const paraphrase of GLUCOSE_PARAPHRASES) {
    console.log(`\nParaphrase: ${paraphrase}`);
    const { text: paraphraseText } = await collectStreamText(userId, paraphrase, profile, []);
    console.log("Response preview:", paraphraseText.slice(0, 160));
    assertGlucoseParaphraseResponse(paraphrase, paraphraseText);
    await sleep(5000);
  }

  console.log("\nRAG chat backend verification passed.");
}

main().catch((error) => {
  console.error("RAG chat test failed:", error);
  process.exit(1);
});

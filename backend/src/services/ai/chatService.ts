import { CHAT_MODEL } from "../../config/gemini.js";
import type { ChatSource, Message } from "../../types/chat.js";
import type { Profile } from "../../types/profile.js";
import { toChatSources } from "../../types/chat.js";
import { applyGuardrails } from "./guardrails.js";
import { buildPrompt, getHistoryLimit } from "./chatPrompts.js";
import { retrieveForChat } from "./chatRetrieval.js";
import { expandRetrievalQueries } from "./chatQueryExpansion.js";
import { fetchStructuredFacts } from "./chatStructuredFacts.js";
import { streamGenerateText } from "./geminiStream.js";

export type StreamChatInput = {
  userId: string;
  userMessage: string;
  profile: Profile | null;
  history: Message[];
};

export type StreamChatResult = {
  kind: "override";
  content: string;
  sources: ChatSource[];
};

export type StreamChatToken = {
  kind: "token";
  content: string;
};

export type StreamChatComplete = {
  kind: "complete";
  content: string;
  sources: ChatSource[];
};

export type StreamChatEvent = StreamChatResult | StreamChatToken | StreamChatComplete;

export async function* streamChatReply(input: StreamChatInput): AsyncGenerator<StreamChatEvent> {
  const guardrail = applyGuardrails(input.userMessage);

  if (guardrail.override && guardrail.response) {
    yield {
      kind: "override",
      content: guardrail.response,
      sources: [],
    };
    return;
  }

  const history = input.history.slice(-getHistoryLimit());
  const searchQueries = await expandRetrievalQueries(input.userMessage, history);

  const [retrievedChunks, structuredFacts] = await Promise.all([
    retrieveForChat(input.userId, input.userMessage, history, undefined, searchQueries),
    fetchStructuredFacts(input.userId, input.userMessage, input.profile, searchQueries),
  ]);

  const sources = toChatSources(retrievedChunks);

  const prompt = buildPrompt({
    profile: input.profile,
    retrievedChunks,
    structuredFacts: structuredFacts.formatted,
    history,
    userMessage: input.userMessage,
  });

  let fullText = "";

  for await (const token of streamGenerateText(CHAT_MODEL, prompt)) {
    fullText += token;
    yield {
      kind: "token",
      content: token,
    };
  }

  yield {
    kind: "complete",
    content: fullText.trim(),
    sources,
  };
}

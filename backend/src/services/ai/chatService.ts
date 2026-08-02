import { CHAT_MODEL } from "../../config/gemini.js";
import type { ChatSource, Message } from "../../types/chat.js";
import type { Profile } from "../../types/profile.js";
import { toChatSources } from "../../types/chat.js";
import { applyGuardrails } from "./guardrails.js";
import { buildPrompt, getHistoryLimit } from "./chatPrompts.js";
import { retrieveRelevantChunks } from "./chatRetrieval.js";
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

  const retrievedChunks = await retrieveRelevantChunks(input.userId, input.userMessage);
  const sources = toChatSources(retrievedChunks);
  const history = input.history.slice(-getHistoryLimit());

  const prompt = buildPrompt({
    profile: input.profile,
    retrievedChunks,
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

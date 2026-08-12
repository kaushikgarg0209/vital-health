import type { PaginatedMeta } from "@/types/document";

export type MessageRole = "user" | "assistant";

export type ChatSource = {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  excerpt: string;
  similarity: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources: ChatSource[];
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type ConversationDetail = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type CreatedSession = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListSessionsQuery = {
  page?: number;
  limit?: number;
};

export type ListSessionsResult = {
  sessions: ConversationSummary[];
  meta: PaginatedMeta;
};

export type SseTokenEvent = {
  type: "token";
  content: string;
};

export type SseDoneEvent = {
  type: "done";
  messageId: string;
  sources: ChatSource[];
};

export type SseErrorEvent = {
  type: "error";
  message: string;
  code?: string;
};

export type SseEvent = SseTokenEvent | SseDoneEvent | SseErrorEvent;

export type UiChatMessage = ChatMessage & {
  isStreaming?: boolean;
};

export function toUiChatMessage(message: ChatMessage): UiChatMessage {
  return {
    ...message,
    isStreaming: false,
  };
}

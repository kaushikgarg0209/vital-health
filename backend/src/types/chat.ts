export type MessageRole = "user" | "assistant";

export type ChatSource = {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  excerpt: string;
  similarity: number;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  sources: ChatSource[] | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  sources: ChatSource[];
  created_at: string;
};

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type MessageResponse = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources: ChatSource[];
  createdAt: string;
};

export type ConversationResponse = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: MessageResponse[];
};

export type RetrievedChunkContext = {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  similarity: number;
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
};

export type SseEvent = SseTokenEvent | SseDoneEvent | SseErrorEvent;

export function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    summary: row.summary,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    user_id: row.user_id,
    role: row.role,
    content: row.content,
    sources: row.sources ?? [],
    created_at: row.created_at,
  };
}

export function toMessageResponse(message: Message): MessageResponse {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    role: message.role,
    content: message.content,
    sources: message.sources,
    createdAt: message.created_at,
  };
}

export function toConversationResponse(conversation: ConversationWithMessages): ConversationResponse {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: conversation.messages.map(toMessageResponse),
  };
}

export function toConversationSummary(
  conversation: Conversation,
  messageCount: number,
): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messageCount,
  };
}

export function toChatSources(chunks: RetrievedChunkContext[]): ChatSource[] {
  const seen = new Set<string>();
  const sources: ChatSource[] = [];

  for (const chunk of chunks) {
    const key = `${chunk.documentId}:${chunk.chunkIndex}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    sources.push({
      documentId: chunk.documentId,
      fileName: chunk.fileName,
      chunkIndex: chunk.chunkIndex,
      excerpt: chunk.content.length > 200 ? `${chunk.content.slice(0, 199)}…` : chunk.content,
      similarity: chunk.similarity,
    });
  }

  return sources;
}

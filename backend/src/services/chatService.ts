import { supabaseAdmin } from "../config/supabase.js";
import type {
  ChatSource,
  Conversation,
  ConversationRow,
  ConversationWithMessages,
  Message,
  MessageRole,
  MessageRow,
} from "../types/chat.js";
import { mapConversation, mapMessage } from "../types/chat.js";

export class ChatError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ChatError";
  }
}

export async function createConversation(
  userId: string,
  title: string | null = null,
): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      user_id: userId,
      title,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new ChatError(error?.message ?? "Failed to create conversation", 500, "INTERNAL_ERROR");
  }

  return mapConversation(data as ConversationRow);
}

export async function listConversations(
  userId: string,
  page: number,
  limit: number,
): Promise<{ conversations: Conversation[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from("conversations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  return {
    conversations: (data ?? []).map((row) => mapConversation(row as ConversationRow)),
    total: count ?? 0,
  };
}

export async function getConversationMessageCount(conversationId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  return count ?? 0;
}

export async function getConversationById(
  userId: string,
  conversationId: string,
): Promise<ConversationWithMessages | null> {
  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (conversationError) {
    throw new ChatError(conversationError.message, 500, "INTERNAL_ERROR");
  }

  if (!conversation) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new ChatError(messagesError.message, 500, "INTERNAL_ERROR");
  }

  return {
    ...mapConversation(conversation as ConversationRow),
    messages: (messages ?? []).map((row) => mapMessage(row as MessageRow)),
  };
}

export async function getRecentMessages(
  userId: string,
  conversationId: string,
  limit: number,
): Promise<Message[]> {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data ?? [])
    .map((row) => mapMessage(row as MessageRow))
    .reverse();
}

export async function saveMessage(
  conversationId: string,
  userId: string,
  role: MessageRole,
  content: string,
  sources: ChatSource[] = [],
): Promise<Message> {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      sources: role === "assistant" ? sources : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new ChatError(error?.message ?? "Failed to save message", 500, "INTERNAL_ERROR");
  }

  await supabaseAdmin
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", userId);

  return mapMessage(data as MessageRow);
}

export async function touchConversationTitle(
  conversationId: string,
  userId: string,
  title: string,
): Promise<void> {
  const { data: conversation, error: fetchError } = await supabaseAdmin
    .from("conversations")
    .select("title")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new ChatError(fetchError.message, 500, "INTERNAL_ERROR");
  }

  if (!conversation || conversation.title) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("conversations")
    .update({
      title: title.slice(0, 200),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }
}

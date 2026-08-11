import type { Request, Response } from "express";
import type {
  CreateConversationInput,
  ListConversationsQuery,
  SendMessageInput,
} from "../schemas/chatSchemas.js";
import { streamChatReply } from "../services/ai/chatService.js";
import { getHistoryLimit } from "../services/ai/chatPrompts.js";
import {
  ChatError,
  createConversation,
  getConversationById,
  getConversationMessageCount,
  getRecentMessages,
  listConversations,
  saveMessage,
  touchConversationTitle,
} from "../services/chatService.js";
import { getProfileByUserId } from "../services/profileService.js";
import {
  toConversationResponse,
  toConversationSummary,
  type SseEvent,
} from "../types/chat.js";
import { sendError, sendPaginatedSuccess, sendSuccess } from "../utils/responseHelpers.js";
import {
  GEMINI_RATE_LIMIT_MESSAGE,
  isGeminiRateLimitError,
  toGeminiRateLimitError,
} from "../services/ai/geminiRetry.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function handleChatError(res: Response, error: unknown, context: string): void {
  if (error instanceof ChatError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  if (isGeminiRateLimitError(error)) {
    sendError(res, 429, GEMINI_RATE_LIMIT_MESSAGE, "RATE_LIMIT_EXCEEDED");
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

function resolveStreamError(error: unknown): { message: string; code: string; statusCode: number } {
  if (isGeminiRateLimitError(error)) {
    const rateLimitError = toGeminiRateLimitError(error);

    return {
      message: rateLimitError.message,
      code: rateLimitError.code,
      statusCode: rateLimitError.statusCode,
    };
  }

  return {
    message: "Chat stream failed. Please try again.",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}

function writeSseEvent(res: Response, event: SseEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export async function createSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as CreateConversationInput;
    const conversation = await createConversation(req.user!.id, body.title ?? null);

    sendSuccess(res, 201, {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    });
  } catch (error) {
    handleChatError(res, error, "Create chat session");
  }
}

export async function listSessionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const query = req.validatedQuery as ListConversationsQuery;
    const { conversations, total } = await listConversations(
      req.user!.id,
      query.page,
      query.limit,
    );

    const summaries = await Promise.all(
      conversations.map(async (conversation) => {
        const messageCount = await getConversationMessageCount(conversation.id);
        return toConversationSummary(conversation, messageCount);
      }),
    );

    sendPaginatedSuccess(res, 200, summaries, {
      total,
      page: query.page,
      limit: query.limit,
      hasMore: query.page * query.limit < total,
    });
  } catch (error) {
    handleChatError(res, error, "List chat sessions");
  }
}

export async function getSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const conversationId = getRouteParam(req.params.id);
    const conversation = await getConversationById(req.user!.id, conversationId);

    if (!conversation) {
      sendError(res, 404, "Conversation not found", "NOT_FOUND");
      return;
    }

    sendSuccess(res, 200, toConversationResponse(conversation));
  } catch (error) {
    handleChatError(res, error, "Get chat session");
  }
}

export async function streamMessageHandler(req: Request, res: Response): Promise<void> {
  const conversationId = getRouteParam(req.params.id);
  const userId = req.user!.id;
  const body = req.body as SendMessageInput;

  try {
    const conversation = await getConversationById(userId, conversationId);

    if (!conversation) {
      sendError(res, 404, "Conversation not found", "NOT_FOUND");
      return;
    }

    const [profile, history] = await Promise.all([
      getProfileByUserId(userId),
      getRecentMessages(userId, conversationId, getHistoryLimit()),
    ]);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    await saveMessage(conversationId, userId, "user", body.message);
    await touchConversationTitle(conversationId, userId, body.message);

    let assistantContent = "";
    let sources: import("../types/chat.js").ChatSource[] = [];

    for await (const event of streamChatReply({
      userId,
      userMessage: body.message,
      profile,
      history,
    })) {
      if (event.kind === "override") {
        assistantContent = event.content;
        sources = event.sources;
        writeSseEvent(res, { type: "token", content: event.content });
        break;
      }

      if (event.kind === "token") {
        assistantContent += event.content;
        writeSseEvent(res, { type: "token", content: event.content });
      }

      if (event.kind === "complete") {
        assistantContent = event.content;
        sources = event.sources;
      }
    }

    const assistantMessage = await saveMessage(
      conversationId,
      userId,
      "assistant",
      assistantContent,
      sources,
    );

    writeSseEvent(res, {
      type: "done",
      messageId: assistantMessage.id,
      sources,
    });
    res.end();
  } catch (error) {
    console.error("Stream chat message error:", error);

    const streamError = resolveStreamError(error);

    if (!res.headersSent) {
      sendError(res, streamError.statusCode, streamError.message, streamError.code);
      return;
    }

    writeSseEvent(res, {
      type: "error",
      message: streamError.message,
      code: streamError.code,
    });
    res.end();
  }
}

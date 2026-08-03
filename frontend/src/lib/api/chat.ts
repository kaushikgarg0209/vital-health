import type {
  ChatSource,
  ConversationDetail,
  ConversationSummary,
  CreatedSession,
  ListSessionsQuery,
  ListSessionsResult,
  SseEvent,
} from "@/types/chat";
import type { PaginatedMeta } from "@/types/document";
import { ApiError, apiFetch, resolveUrl } from "./client";

type ApiDataResponse<T> = {
  data: T;
};

type ApiPaginatedResponse<T> = {
  data: T;
  meta: PaginatedMeta;
};

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
  };
};

function buildQueryString(query: ListSessionsQuery): string {
  const params = new URLSearchParams();

  if (query.page != null) {
    params.set("page", String(query.page));
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function createSession(title?: string): Promise<CreatedSession> {
  const response = await apiFetch<ApiDataResponse<CreatedSession>>("/api/v1/chat/sessions", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });

  return response.data;
}

export async function listSessions(
  query: ListSessionsQuery = {},
): Promise<ListSessionsResult> {
  const response = await apiFetch<ApiPaginatedResponse<ConversationSummary[]>>(
    `/api/v1/chat/sessions${buildQueryString(query)}`,
  );

  return {
    sessions: response.data,
    meta: response.meta,
  };
}

export async function getSession(sessionId: string): Promise<ConversationDetail> {
  const response = await apiFetch<ApiDataResponse<ConversationDetail>>(
    `/api/v1/chat/sessions/${sessionId}`,
  );

  return response.data;
}

export type StreamMessageHandlers = {
  onToken: (content: string) => void;
  onDone: (payload: { messageId: string; sources: ChatSource[] }) => void;
  onError: (message: string) => void;
};

function dispatchSseEvent(event: SseEvent, handlers: StreamMessageHandlers): boolean {
  if (event.type === "token") {
    handlers.onToken(event.content);
    return false;
  }

  if (event.type === "done") {
    handlers.onDone({
      messageId: event.messageId,
      sources: event.sources,
    });
    return true;
  }

  handlers.onError(event.message);
  return true;
}

function parseSseLine(line: string, handlers: StreamMessageHandlers): boolean {
  const trimmed = line.trim();

  if (!trimmed.startsWith("data:")) {
    return false;
  }

  const payload = trimmed.slice(5).trim();

  if (!payload) {
    return false;
  }

  const event = JSON.parse(payload) as SseEvent;
  return dispatchSseEvent(event, handlers);
}

export async function streamMessage(
  sessionId: string,
  message: string,
  handlers: StreamMessageHandlers,
): Promise<void> {
  const response = await fetch(resolveUrl(`/api/v1/chat/sessions/${sessionId}/messages`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    const errorBody = body as ApiErrorBody | undefined;
    const errorMessage =
      errorBody?.error?.message ?? `Chat stream failed: ${response.statusText}`;

    throw new ApiError(errorMessage, response.status, errorBody?.error?.code, body);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new ApiError("Chat stream returned no body", 500);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  while (!finished) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (parseSseLine(line, handlers)) {
        finished = true;
        break;
      }
    }
  }

  if (!finished && buffer.trim()) {
    parseSseLine(buffer, handlers);
  }
}

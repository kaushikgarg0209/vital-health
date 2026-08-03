"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/lib/api/chat";
import { useChatStore } from "@/lib/stores/chatStore";
import { toUiChatMessage } from "@/types/chat";

export const chatSessionQueryKey = (sessionId: string | null) =>
  ["chat", "session", sessionId] as const;

export function useChatSession(sessionId: string | null) {
  const setMessages = useChatStore((state) => state.setMessages);
  const isStreaming = useChatStore((state) => state.isStreaming);

  const query = useQuery({
    queryKey: chatSessionQueryKey(sessionId),
    queryFn: () => getSession(sessionId!),
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    if (!sessionId || !query.data || isStreaming) {
      return;
    }

    setMessages(query.data.messages.map(toUiChatMessage));
  }, [sessionId, query.data, isStreaming, setMessages]);

  return query;
}

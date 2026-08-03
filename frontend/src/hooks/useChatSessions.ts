"use client";

import { useQuery } from "@tanstack/react-query";
import { listSessions } from "@/lib/api/chat";
import type { ListSessionsQuery } from "@/types/chat";

export const chatSessionsQueryKey = (query: ListSessionsQuery = {}) =>
  ["chat", "sessions", query] as const;

export function useChatSessions(query: ListSessionsQuery = {}) {
  return useQuery({
    queryKey: chatSessionsQueryKey(query),
    queryFn: () => listSessions(query),
  });
}

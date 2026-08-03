"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSession } from "@/lib/api/chat";
import { chatSessionsQueryKey } from "@/hooks/useChatSessions";

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatSessionsQueryKey() });
    },
  });
}

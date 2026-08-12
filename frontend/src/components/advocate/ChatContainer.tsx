"use client";

import { useCallback, useEffect, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
import { ChatInput } from "@/components/advocate/ChatInput";
import { ChatMessage } from "@/components/advocate/ChatMessage";
import { StreamingMessage } from "@/components/advocate/StreamingMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChatSession, chatSessionQueryKey } from "@/hooks/useChatSession";
import { useCreateChatSession } from "@/hooks/useCreateChatSession";
import { chatSessionsQueryKey } from "@/hooks/useChatSessions";
import { streamMessage } from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import { useChatStore } from "@/lib/stores/chatStore";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Explain my last blood test",
  "What medications am I on?",
  "Summarize my recent lab results",
];

const AUTO_SCROLL_THRESHOLD_PX = 80;

export function ChatContainer({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const createSessionMutation = useCreateChatSession();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const streamingText = useChatStore((state) => state.streamingText);
  const error = useChatStore((state) => state.error);
  const errorCode = useChatStore((state) => state.errorCode);
  const lastFailedMessage = useChatStore((state) => state.lastFailedMessage);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const startStreaming = useChatStore((state) => state.startStreaming);
  const appendToken = useChatStore((state) => state.appendToken);
  const finalizeMessage = useChatStore((state) => state.finalizeMessage);
  const setError = useChatStore((state) => state.setError);
  const clearError = useChatStore((state) => state.clearError);
  const setActiveSession = useChatStore((state) => state.setActiveSession);

  const { isLoading: isLoadingSession } = useChatSession(activeSessionId);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container || !shouldAutoScrollRef.current) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: useChatStore.getState().isStreaming ? "auto" : "smooth",
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, streamingText, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string) => {
      clearError();
      shouldAutoScrollRef.current = true;

      let sessionId = activeSessionId;

      try {
        if (!sessionId) {
          const session = await createSessionMutation.mutateAsync(undefined);
          sessionId = session.id;
          setActiveSession(sessionId);
        }

        addUserMessage(text);
        startStreaming();

        await streamMessage(sessionId, text, {
          onToken: appendToken,
          onDone: ({ messageId, sources }) => {
            finalizeMessage(messageId, sources);
            void queryClient.invalidateQueries({ queryKey: chatSessionsQueryKey() });
            void queryClient.invalidateQueries({
              queryKey: chatSessionQueryKey(sessionId),
            });
          },
          onError: (message, code) => {
            setError(message, code, text);
          },
        });

        if (useChatStore.getState().isStreaming) {
          setError("The response ended unexpectedly. Please try again.");
        }
      } catch (sendError) {
        const message =
          sendError instanceof ApiError
            ? sendError.message
            : sendError instanceof Error
              ? sendError.message
              : "Failed to send message.";

        const code = sendError instanceof ApiError ? sendError.code : undefined;
        setError(message, code, text);
      }
    },
    [
      activeSessionId,
      addUserMessage,
      appendToken,
      clearError,
      createSessionMutation,
      finalizeMessage,
      queryClient,
      setActiveSession,
      setError,
      startStreaming,
    ],
  );

  const showEmptyState = !isLoadingSession && messages.length === 0 && !isStreaming;

  return (
    <Card className={cn("flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden border-neutral-100 py-0 shadow-none", className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-behavior-contain px-4 py-6 sm:px-6"
        >
          {showEmptyState ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Bot className="size-7" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-neutral-800">
                Your AI health advocate
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
                Ask questions about your uploaded records. Vital searches your documents and
                answers with citations — it never diagnoses or replaces your doctor.
              </p>

              <div className="mt-6 flex w-full max-w-lg flex-col gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start rounded-xl border-neutral-200 px-4 py-3 text-left text-sm font-normal text-neutral-700"
                    disabled={isStreaming || createSessionMutation.isPending}
                    onClick={() => void handleSend(prompt)}
                  >
                    <Sparkles className="size-4 shrink-0 text-primary-500" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <StreamingMessage />
            </div>
          )}
        </div>

        {error ? (
          <div
            className={cn(
              "shrink-0 border-t px-4 py-3 text-sm sm:px-6",
              errorCode === "RATE_LIMIT_EXCEEDED"
                ? "border-amber-100 bg-amber-50 text-amber-900"
                : "border-red-100 bg-red-50 text-red-700",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{error}</p>
              {lastFailedMessage ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={isStreaming || createSessionMutation.isPending}
                  onClick={() => void handleSend(lastFailedMessage)}
                >
                  Try again
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="shrink-0 border-t border-neutral-100 p-4 sm:p-6">
          <ChatInput
            onSend={(message) => void handleSend(message)}
            isStreaming={isStreaming}
            disabled={createSessionMutation.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

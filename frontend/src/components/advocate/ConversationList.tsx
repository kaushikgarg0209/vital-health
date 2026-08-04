"use client";

import { Loader2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChatSessions } from "@/hooks/useChatSessions";
import type { ConversationSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

type ConversationListProps = {
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onNavigate?: () => void;
  className?: string;
};

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ConversationItem({
  session,
  isActive,
  onSelect,
}: {
  session: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
}) {
  const title = session.title?.trim() || "New conversation";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
        isActive
          ? "bg-primary-50 text-primary-800 ring-1 ring-primary-100"
          : "text-neutral-700 hover:bg-neutral-50",
      )}
    >
      <p className="truncate text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {formatRelativeDate(session.updatedAt)} · {session.messageCount} messages
      </p>
    </button>
  );
}

export function ConversationList({
  activeSessionId,
  onSelect,
  onNewChat,
  onNavigate,
  className,
}: ConversationListProps) {
  const { data, isLoading, isError, error, refetch } = useChatSessions();

  const sessions = data?.sessions ?? [];

  return (
    <Card className={cn("flex h-full min-h-0 w-full min-w-0 flex-col gap-0 border-neutral-100 py-0 shadow-none", className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full shrink-0 justify-start rounded-xl border-neutral-200"
          onClick={() => {
            onNewChat();
            onNavigate?.();
          }}
        >
          <MessageSquarePlus className="size-4" />
          New chat
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-neutral-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : null}

        {isError ? (
          <div className="space-y-2 py-4 text-center">
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : "Failed to load conversations."}
            </p>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-neutral-500">
            No conversations yet. Start a new chat to ask about your records.
          </p>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {sessions.map((session) => (
              <ConversationItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onSelect={() => {
                  onSelect(session.id);
                  onNavigate?.();
                }}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

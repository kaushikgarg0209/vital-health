"use client";

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { ChatContainer } from "@/components/advocate/ChatContainer";
import { ConversationSidebar } from "@/components/advocate/ConversationSidebar";
import { useChatStore } from "@/lib/stores/chatStore";

export default function AdvocatePage() {
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const setActiveSession = useChatStore((state) => state.setActiveSession);
  const setMessages = useChatStore((state) => state.setMessages);
  const reset = useChatStore((state) => state.reset);

  function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) {
      return;
    }

    setMessages([]);
    setActiveSession(sessionId);
  }

  function handleNewChat() {
    reset();
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] w-full min-w-0 max-w-6xl flex-col gap-6 overflow-hidden sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)]">
      <div className="shrink-0 space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "AI Advocate" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">AI Advocate</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Ask questions about your health records. Answers are grounded in your uploaded
            documents with source citations.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ConversationSidebar
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onNewChat={handleNewChat}
        >
          <ChatContainer className="min-h-0 flex-1" />
        </ConversationSidebar>
      </div>
    </div>
  );
}

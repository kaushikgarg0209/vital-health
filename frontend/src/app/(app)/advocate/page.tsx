"use client";

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { ChatContainer } from "@/components/advocate/ChatContainer";
import { ConversationList } from "@/components/advocate/ConversationList";
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-4">
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

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <ConversationList
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onNewChat={handleNewChat}
        />
        <ChatContainer />
      </div>
    </div>
  );
}

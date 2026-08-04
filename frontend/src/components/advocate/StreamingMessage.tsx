"use client";

import { Bot } from "lucide-react";
import { ChatMarkdown } from "@/components/advocate/ChatMarkdown";
import { useTypewriterStream } from "@/hooks/useTypewriterStream";
import { useChatStore } from "@/lib/stores/chatStore";

export function StreamingMessage() {
  const streamingText = useChatStore((state) => state.streamingText);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const displayText = useTypewriterStream(streamingText, isStreaming);

  if (!isStreaming) {
    return null;
  }

  return (
    <div className="flex min-w-0 gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        <Bot className="size-4" />
      </div>

      <div className="min-w-0 max-w-[85%] rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-sm shadow-neutral-100/60">
        <ChatMarkdown content={displayText} showCursor />
      </div>
    </div>
  );
}

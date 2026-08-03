"use client";

import { Bot } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";

export function StreamingMessage() {
  const streamingText = useChatStore((state) => state.streamingText);
  const isStreaming = useChatStore((state) => state.isStreaming);

  if (!isStreaming) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        <Bot className="size-4" />
      </div>

      <div className="max-w-[85%] rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-800 shadow-sm shadow-neutral-100/60">
        <p className="whitespace-pre-wrap">
          {streamingText}
          <span
            className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary-500 align-text-bottom"
            aria-hidden
          />
        </p>
      </div>
    </div>
  );
}

import { Bot, UserRound } from "lucide-react";
import { ChatMarkdown } from "@/components/advocate/ChatMarkdown";
import { SourceCitations } from "@/components/advocate/SourceCitations";
import type { UiChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: UiChatMessage;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex min-w-0 gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl",
          isUser ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-600",
        )}
      >
        {isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}
      </div>

      <div
        className={cn(
          "min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary-600 text-white"
            : "border border-neutral-100 bg-white text-neutral-800 shadow-sm shadow-neutral-100/60",
        )}
      >
        {isUser ? (
          <p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>
        ) : (
          <ChatMarkdown content={message.content} />
        )}
        {!isUser ? <SourceCitations sources={message.sources} /> : null}
      </div>
    </div>
  );
}

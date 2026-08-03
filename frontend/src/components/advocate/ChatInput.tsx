"use client";

import { useCallback, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
};

export function ChatInput({
  onSend,
  disabled = false,
  isStreaming = false,
  placeholder = "Ask about your health records…",
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

  function handleSubmit() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const value = textarea.value.trim();

    if (!value || disabled || isStreaming) {
      return;
    }

    onSend(value);
    textarea.value = "";
    resizeTextarea();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm shadow-neutral-100/60",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={placeholder}
        disabled={disabled || isStreaming}
        onChange={resizeTextarea}
        onKeyDown={handleKeyDown}
        className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <Button
        type="button"
        size="icon"
        className="size-9 shrink-0 rounded-xl"
        disabled={disabled || isStreaming}
        onClick={handleSubmit}
        aria-label="Send message"
      >
        {isStreaming ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}

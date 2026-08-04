"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type ChatMarkdownProps = {
  content: string;
  showCursor?: boolean;
  className?: string;
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-neutral-700">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-neutral-900 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1 text-base font-semibold text-neutral-900 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold text-neutral-900 first:mt-0">{children}</h3>
  ),
  code: ({ children }) => (
    <code className="overflow-x-auto rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.85em] break-all text-neutral-800">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-neutral-200 pl-3 text-neutral-600">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary-600 underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
};

export function ChatMarkdown({ content, showCursor = false, className }: ChatMarkdownProps) {
  if (!content && !showCursor) {
    return null;
  }

  return (
    <div className={cn("chat-markdown break-words text-sm leading-relaxed text-neutral-800 [overflow-wrap:anywhere]", className)}>
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      ) : null}
      {showCursor ? (
        <span
          className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary-500 align-text-bottom"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

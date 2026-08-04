"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PanelLeft, X } from "lucide-react";
import { ConversationList } from "@/components/advocate/ConversationList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConversationSidebarProps = {
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  children: ReactNode;
};

const DESKTOP_HISTORY_MIN_WIDTH = 1280;
const DESKTOP_HISTORY_MEDIA_QUERY = `(min-width: ${DESKTOP_HISTORY_MIN_WIDTH}px)`;

function isDesktopHistoryViewport() {
  return window.matchMedia(DESKTOP_HISTORY_MEDIA_QUERY).matches;
}

function useHistoryOpenState() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_HISTORY_MEDIA_QUERY);

    function syncOpenState() {
      setOpen(mediaQuery.matches);
    }

    syncOpenState();
    mediaQuery.addEventListener("change", syncOpenState);

    return () => {
      mediaQuery.removeEventListener("change", syncOpenState);
    };
  }, []);

  return [open, setOpen] as const;
}

export function ConversationSidebar({
  activeSessionId,
  onSelect,
  onNewChat,
  children,
}: ConversationSidebarProps) {
  const [open, setOpen] = useHistoryOpenState();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(false);
  }, []);

  function handleToggle() {
    if (isDesktopHistoryViewport()) {
      setOpen((current) => !current);
      return;
    }

    setMobileDrawerOpen((current) => !current);
  }

  function handleSelectSession(sessionId: string) {
    onSelect(sessionId);
    closeMobileDrawer();
  }

  function handleNewChat() {
    onNewChat();
    closeMobileDrawer();
  }

  useEffect(() => {
    if (!mobileDrawerOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileDrawer();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileDrawerOpen, closeMobileDrawer]);

  const isDesktopOpen = open;
  const isMobileOpen = mobileDrawerOpen;
  const toggleExpanded = isMobileOpen || isDesktopOpen;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl border-neutral-200"
          onClick={handleToggle}
          aria-label="Toggle chat history"
          aria-expanded={toggleExpanded}
        >
          <PanelLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-neutral-600">Chat history</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside
          className={cn(
            "hidden min-h-0 shrink-0 transition-all duration-200 xl:block",
            isDesktopOpen ? "w-[280px] opacity-100" : "w-0 overflow-hidden opacity-0",
          )}
          aria-hidden={!isDesktopOpen}
        >
          <ConversationList
            activeSessionId={activeSessionId}
            onSelect={handleSelectSession}
            onNewChat={handleNewChat}
            className="h-full"
          />
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            aria-label="Close chat history"
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px]"
            onClick={closeMobileDrawer}
          />

          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(85vw,18rem)] flex-col border-r border-neutral-200 bg-white shadow-xl",
              "animate-in slide-in-from-left duration-200",
            )}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
              <p className="text-sm font-semibold text-neutral-800">Chat history</p>
              <button
                type="button"
                onClick={closeMobileDrawer}
                className="inline-flex size-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
                aria-label="Close chat history"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <ConversationList
                activeSessionId={activeSessionId}
                onSelect={handleSelectSession}
                onNewChat={handleNewChat}
                className="h-full"
              />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

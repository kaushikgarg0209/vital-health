"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { AuthUser } from "@/types/auth";
import { AppSidebarNav } from "./app-sidebar-nav";
import { UserAccountMenu } from "./user-account-menu";
import { VitalLogo } from "./vital-logo";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  user: AuthUser | null;
};

export function AppHeader({ user }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" />
          </button>

          <div className="md:hidden">
            <VitalLogo href="/dashboard" iconClassName="size-8 rounded-lg" labelClassName="text-base" />
          </div>

          <p className="hidden text-sm text-neutral-500 md:block">
            Your personal health advocate
          </p>
        </div>

        {user ? <UserAccountMenu user={user} /> : null}
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(85vw,18rem)] flex-col border-r border-neutral-200 bg-white shadow-xl",
              "animate-in slide-in-from-left duration-200",
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
              <VitalLogo href="/dashboard" iconClassName="size-8 rounded-lg" labelClassName="text-base" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
                aria-label="Close navigation menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AppSidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

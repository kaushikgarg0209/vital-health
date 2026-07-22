"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { logout } from "@/lib/api/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

type UserAccountMenuProps = {
  user: AuthUser;
  variant?: "default" | "transparent";
};

function getInitials(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  const parts = localPart.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase();
}

export function UserAccountMenu({
  user,
  variant = "default",
}: UserAccountMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await logout();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition-colors",
          variant === "transparent"
            ? "border-white/15 bg-white/10 hover:bg-white/15"
            : "border-neutral-200 bg-white hover:bg-neutral-50",
        )}
      >
        <Avatar size="sm" className="size-8">
          <AvatarFallback className="bg-primary-100 text-xs font-semibold text-primary-700">
            {getInitials(user.email)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open && "rotate-180",
            variant === "transparent" ? "text-neutral-200" : "text-neutral-500",
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg shadow-neutral-900/10"
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-medium text-neutral-800" title={user.email}>
              {user.email}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <LayoutDashboard className="size-4 text-neutral-400" />
              Dashboard
            </Link>
            <Link
              href="/settings/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <Settings className="size-4 text-neutral-400" />
              Profile settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              <LogOut className="size-4 text-neutral-400" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

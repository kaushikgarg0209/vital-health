import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";
import { UserAccountMenu } from "./user-account-menu";
import { VitalLogo } from "./vital-logo";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
];

type SiteHeaderProps = {
  user?: AuthUser | null;
  className?: string;
  variant?: "default" | "transparent";
};

export function SiteHeader({
  user = null,
  className,
  variant = "default",
}: SiteHeaderProps) {
  const isLoggedIn = Boolean(user);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        variant === "transparent"
          ? "border-white/10 bg-neutral-900/70"
          : "border-neutral-200/80 bg-white/85",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <VitalLogo
          labelClassName={variant === "transparent" ? "text-white" : undefined}
        />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                variant === "transparent"
                  ? "text-neutral-300 hover:text-white"
                  : "text-neutral-500 hover:text-neutral-800",
              )}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors",
                variant === "transparent"
                  ? "text-neutral-200 hover:text-white"
                  : "text-neutral-600 hover:text-primary-600",
              )}
            >
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn && user ? (
            <UserAccountMenu user={user} variant={variant} />
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: cn(
                    variant === "transparent" &&
                      "text-neutral-200 hover:bg-white/10 hover:text-white",
                  ),
                })}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={buttonVariants({
                  size: "sm",
                  className: cn(
                    "shadow-sm shadow-primary-600/20",
                    variant === "transparent"
                      ? "bg-white text-primary-700 hover:bg-primary-50"
                      : "bg-primary-600 text-white hover:bg-primary-700",
                  ),
                })}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

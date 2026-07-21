import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

type MarketingCtaButtonsProps = {
  user: AuthUser | null;
  variant: "hero" | "footer";
};

export function MarketingCtaButtons({ user, variant }: MarketingCtaButtonsProps) {
  if (user) {
    if (variant === "hero") {
      return (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className={buttonVariants({
              size: "lg",
              className:
                "h-11 bg-primary-600 px-6 text-base text-white shadow-md shadow-primary-600/20 hover:bg-primary-700",
            })}
          >
            Go to dashboard
            <LayoutDashboard className="size-4" />
          </Link>
          <Link
            href="/#features"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "h-11 border-neutral-200 bg-white px-6 text-base",
            })}
          >
            Explore features
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-6 text-base font-medium shadow-sm transition-colors",
            "bg-white text-primary-700 hover:bg-primary-50",
          )}
        >
          Open dashboard
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className={buttonVariants({
            size: "lg",
            className:
              "h-11 bg-primary-600 px-6 text-base text-white shadow-md shadow-primary-600/20 hover:bg-primary-700",
          })}
        >
          Start for free
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/login"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "h-11 border-neutral-200 bg-white px-6 text-base",
          })}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <Link
        href="/register"
        className={cn(
          "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-6 text-base font-medium shadow-sm transition-colors",
          "bg-white text-primary-700 hover:bg-primary-50",
        )}
      >
        Create your account
        <ArrowRight className="size-4" />
      </Link>
      <Link
        href="/login"
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className:
            "h-11 border-white/20 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white",
        })}
      >
        I already have an account
      </Link>
    </div>
  );
}

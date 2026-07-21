import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type VitalLogoProps = {
  href?: string;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
};

export function VitalLogo({
  href = "/",
  className,
  iconClassName,
  labelClassName,
  showLabel = true,
}: VitalLogoProps) {
  const content = (
    <>
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/25",
          iconClassName,
        )}
      >
        <Activity className="size-5" strokeWidth={2.25} />
      </div>
      {showLabel ? (
        <span className={cn("text-lg font-semibold tracking-tight text-neutral-800", labelClassName)}>
          Vital
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return <div className={cn("flex items-center gap-2.5", className)}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
    >
      {content}
    </Link>
  );
}

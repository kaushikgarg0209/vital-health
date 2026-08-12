import { biomarkerStatus, type BiomarkerStatus } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type BiomarkerStatusBadgeProps = {
  status: BiomarkerStatus | null;
  size?: "sm" | "md";
  className?: string;
};

export function BiomarkerStatusBadge({
  status,
  size = "md",
  className,
}: BiomarkerStatusBadgeProps) {
  if (!status) {
    return (
      <span className={cn("text-neutral-400", size === "sm" ? "text-xs" : "text-sm", className)}>
        Unknown
      </span>
    );
  }

  const token = biomarkerStatus[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        token.bgClass,
        token.textClass,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className={cn("rounded-full", token.dotClass, size === "sm" ? "size-1.5" : "size-2")} />
      {token.label}
    </span>
  );
}

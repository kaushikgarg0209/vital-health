import { labTrendDirection, formatDeltaPct } from "@/lib/lab-utils";
import { cn } from "@/lib/utils";
import type { LabTrendDirection } from "@/types/lab";

type TrendDirectionBadgeProps = {
  direction: LabTrendDirection;
  deltaPct?: number | null;
  className?: string;
};

export function TrendDirectionBadge({
  direction,
  deltaPct,
  className,
}: TrendDirectionBadgeProps) {
  const token = labTrendDirection[direction] ?? labTrendDirection.stable;
  const Icon = token.icon;
  const delta = formatDeltaPct(deltaPct ?? null);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        token.bgClass,
        token.textClass,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {token.label}
      {delta ? <span className="opacity-75">({delta})</span> : null}
    </span>
  );
}

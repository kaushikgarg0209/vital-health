import { permissionLevelTokens, type PermissionLevel } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type PermissionLevelBadgeProps = {
  level: PermissionLevel;
  showDescription?: boolean;
  className?: string;
};

export function PermissionLevelBadge({
  level,
  showDescription = false,
  className,
}: PermissionLevelBadgeProps) {
  const token = permissionLevelTokens[level];

  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          token.bgClass,
          token.textClass,
        )}
      >
        {token.label}
      </span>
      {showDescription ? (
        <span className="text-xs text-neutral-500">{token.description}</span>
      ) : null}
    </div>
  );
}

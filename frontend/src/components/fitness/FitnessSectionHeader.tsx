import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FitnessSectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function FitnessSectionHeader({
  icon: Icon,
  title,
  description,
  className,
}: FitnessSectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        <Icon className="size-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

import { Activity, AlertTriangle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LabStatsStripProps = {
  totalTracked: number;
  concerningCount: number;
  borderlineCount: number;
  className?: string;
};

export function LabStatsStrip({
  totalTracked,
  concerningCount,
  borderlineCount,
  className,
}: LabStatsStripProps) {
  const stats = [
    {
      label: "Biomarkers tracked",
      value: totalTracked,
      icon: Activity,
      accent: "text-primary-600 bg-primary-50",
    },
    {
      label: "Needs attention",
      value: concerningCount,
      icon: AlertTriangle,
      accent: concerningCount > 0 ? "text-rose-600 bg-rose-50" : "text-neutral-500 bg-neutral-50",
    },
    {
      label: "Borderline",
      value: borderlineCount,
      icon: MinusCircle,
      accent: borderlineCount > 0 ? "text-amber-600 bg-amber-50" : "text-neutral-500 bg-neutral-50",
    },
  ];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm"
        >
          <div className={cn("flex size-10 items-center justify-center rounded-xl", stat.accent)}>
            <stat.icon className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-neutral-800">{stat.value}</p>
            <p className="text-xs text-neutral-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Clock, HeartHandshake, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type FamilyStatsStripProps = {
  groupCount: number;
  caringForCount: number;
  pendingCount: number;
  className?: string;
};

export function FamilyStatsStrip({
  groupCount,
  caringForCount,
  pendingCount,
  className,
}: FamilyStatsStripProps) {
  const stats = [
    {
      label: "Family groups",
      value: groupCount,
      icon: Users,
      accent: "text-primary-600 bg-primary-50",
    },
    {
      label: "People you care for",
      value: caringForCount,
      icon: HeartHandshake,
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Pending invitations",
      value: pendingCount,
      icon: Clock,
      accent: pendingCount > 0 ? "text-amber-600 bg-amber-50" : "text-neutral-500 bg-neutral-50",
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

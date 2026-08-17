import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { FamilyGroupSummary } from "@/types/family";
import { cn } from "@/lib/utils";

type FamilyGroupCardProps = {
  group: FamilyGroupSummary;
  roleLabel?: string;
};

export function FamilyGroupCard({ group, roleLabel }: FamilyGroupCardProps) {
  return (
    <Link
      href={`/family/${group.id}`}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md",
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Users className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-800">{group.name}</p>
          <p className="mt-0.5 text-sm text-neutral-500">
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            {roleLabel ? ` · ${roleLabel}` : ""}
          </p>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500" />
    </Link>
  );
}

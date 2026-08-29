import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type FamilyGroupCardProps = {
  groupName: string;
  groupId: string;
  subtitle?: string;
  isLoading?: boolean;
};

export function FamilyGroupCard({
  groupName,
  groupId,
  subtitle,
  isLoading = false,
}: FamilyGroupCardProps) {
  return (
    <Link
      href={`/family/${groupId}`}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md",
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Users className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-800">{groupName}</p>
          <p className="mt-0.5 text-sm text-neutral-500">
            {isLoading ? (
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-neutral-100" />
            ) : (
              subtitle ?? "Member"
            )}
          </p>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500" />
    </Link>
  );
}

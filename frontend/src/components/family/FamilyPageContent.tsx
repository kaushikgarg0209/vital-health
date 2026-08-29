"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { CreateGroupDialog } from "@/components/family/CreateGroupDialog";
import { FamilyEmptyState } from "@/components/family/FamilyEmptyState";
import { FamilyGroupCard } from "@/components/family/FamilyGroupCard";
import { FamilyStatsStrip } from "@/components/family/FamilyStatsStrip";
import { buttonVariants } from "@/components/ui/button";
import { getGroup } from "@/lib/api/family";
import {
  buildGroupCardSubtitle,
  isIncomingPendingInvite,
  isOutgoingPendingInvite,
} from "@/lib/family-membership";
import { familyGroupQueryKey, useFamilyGroups } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";

type FamilyPageContentProps = {
  currentUserId: string;
  currentUserEmail: string;
};

function FamilyPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <div key={item} className="h-24 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

export function FamilyPageContent({
  currentUserId,
  currentUserEmail,
}: FamilyPageContentProps) {
  const router = useRouter();
  const { data: groups = [], isLoading, isError } = useFamilyGroups();
  const [createOpen, setCreateOpen] = useState(false);

  const groupDetailQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: familyGroupQueryKey(group.id),
      queryFn: () => getGroup(group.id),
      enabled: groups.length > 0,
    })),
  });

  const { cardMeta, stats } = useMemo(() => {
    const subtitles = new Map<string, string>();
    let caringForCount = 0;
    let pendingIncomingCount = 0;
    let pendingOutgoingCount = 0;

    for (const query of groupDetailQueries) {
      const detail = query.data;
      if (!detail) {
        continue;
      }

      subtitles.set(
        detail.id,
        buildGroupCardSubtitle(detail, currentUserId, currentUserEmail),
      );

      const isCaregiver = detail.memberships.some(
        (membership) =>
          membership.viewerUserId === currentUserId && membership.status === "accepted",
      );

      if (isCaregiver && detail.createdBy !== currentUserId) {
        caringForCount += 1;
      }

      for (const membership of detail.memberships) {
        if (isIncomingPendingInvite(membership, currentUserId, currentUserEmail)) {
          pendingIncomingCount += 1;
        }

        if (isOutgoingPendingInvite(membership, currentUserId)) {
          pendingOutgoingCount += 1;
        }
      }
    }

    return {
      cardMeta: subtitles,
      stats: {
        groupCount: groups.length,
        caringForCount,
        pendingIncomingCount,
        pendingOutgoingCount,
      },
    };
  }, [groupDetailQueries, currentUserId, currentUserEmail, groups.length]);

  const detailLoadingByGroupId = useMemo(() => {
    const loading = new Map<string, boolean>();

    groups.forEach((group, index) => {
      loading.set(group.id, groupDetailQueries[index]?.isLoading ?? false);
    });

    return loading;
  }, [groups, groupDetailQueries]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Family" }]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Family Health</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Share health updates with trusted caregivers. Health Monitor and Full Access
              caregivers receive in-app alerts when your lab trends change.
            </p>
          </div>

          {groups.length > 0 ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={cn(buttonVariants(), "shrink-0 rounded-xl")}
            >
              <Plus className="size-4" />
              New group
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? <FamilyPageSkeleton /> : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load family groups. Please refresh the page.
        </div>
      ) : null}

      {!isLoading && !isError && groups.length > 0 ? (
        <>
          <FamilyStatsStrip
            groupCount={stats.groupCount}
            caringForCount={stats.caringForCount}
            pendingIncomingCount={stats.pendingIncomingCount}
            pendingOutgoingCount={stats.pendingOutgoingCount}
          />

          <div className="space-y-3">
            {groups.map((group) => (
              <FamilyGroupCard
                key={group.id}
                groupId={group.id}
                groupName={group.name}
                subtitle={cardMeta.get(group.id)}
                isLoading={detailLoadingByGroupId.get(group.id) ?? false}
              />
            ))}
          </div>
        </>
      ) : null}

      {!isLoading && !isError && groups.length === 0 ? (
        <FamilyEmptyState onCreateGroup={() => setCreateOpen(true)} />
      ) : null}

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(groupId) => router.push(`/family/${groupId}`)}
      />
    </div>
  );
}

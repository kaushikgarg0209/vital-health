"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { PermissionLevelBadge } from "@/components/family/PermissionLevelBadge";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonVariants } from "@/components/ui/button";
import { getGroup } from "@/lib/api/family";
import { familyGroupQueryKey, useFamilyGroups, useRevokeMembership } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";
import type { FamilyMembershipDetail } from "@/types/family";

type SettingsFamilyPageContentProps = {
  currentUserId: string;
};

function SharingRow({
  membership,
  onRevoke,
  isRevoking,
}: {
  membership: FamilyMembershipDetail;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const viewerLabel = membership.viewerName ?? membership.inviteeEmail ?? "Pending invite";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div>
        <p className="font-medium text-neutral-800">{viewerLabel}</p>
        <p className="mt-1 text-sm text-neutral-500">
          {membership.status === "pending" ? "Invitation pending" : "Can view your health data"}
        </p>
        <div className="mt-2">
          <PermissionLevelBadge level={membership.permissionLevel} />
        </div>
      </div>
      {membership.status !== "revoked" ? (
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl text-red-600 hover:bg-red-50",
          )}
        >
          Revoke access
        </button>
      ) : null}
    </div>
  );
}

export function SettingsFamilyPageContent({ currentUserId }: SettingsFamilyPageContentProps) {
  const { data: groups = [], isLoading } = useFamilyGroups();
  const revoke = useRevokeMembership();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<FamilyMembershipDetail | null>(null);

  const groupDetailQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: familyGroupQueryKey(group.id),
      queryFn: () => getGroup(group.id),
      enabled: groups.length > 0,
    })),
  });

  const outgoingMemberships = useMemo(() => {
    const memberships: FamilyMembershipDetail[] = [];

    for (const query of groupDetailQueries) {
      if (!query.data) {
        continue;
      }

      for (const membership of query.data.memberships) {
        if (
          membership.subjectUserId === currentUserId &&
          membership.status !== "declined" &&
          membership.status !== "revoked"
        ) {
          memberships.push(membership);
        }
      }
    }

    return memberships;
  }, [groupDetailQueries, currentUserId]);

  async function handleConfirmRevoke() {
    if (!pendingRevoke) {
      return;
    }

    await revoke.mutateAsync(pendingRevoke.id);
    setConfirmOpen(false);
    setPendingRevoke(null);
  }

  const revokeLabel =
    pendingRevoke?.viewerName ?? pendingRevoke?.inviteeEmail ?? "this person";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings", href: "/settings/profile" },
            { label: "Family sharing" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Settings</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Manage who can access your health information.
          </p>
        </div>

        <SettingsTabs />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Who can see your data</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Caregivers you&apos;ve invited across all family groups.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-xl bg-neutral-100" />
            <div className="h-24 rounded-xl bg-neutral-100" />
          </div>
        ) : null}

        {!isLoading && outgoingMemberships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-neutral-500">
              You haven&apos;t shared your health data with anyone yet.
            </p>
            <Link href="/family" className={cn(buttonVariants(), "mt-4 rounded-xl")}>
              Go to Family
            </Link>
          </div>
        ) : null}

        {!isLoading && outgoingMemberships.length > 0 ? (
          <div className="space-y-3">
            {outgoingMemberships.map((membership) => (
              <SharingRow
                key={membership.id}
                membership={membership}
                isRevoking={revoke.isPending}
                onRevoke={() => {
                  setPendingRevoke(membership);
                  setConfirmOpen(true);
                }}
              />
            ))}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingRevoke(null);
          }
        }}
        title="Revoke access?"
        description={`Revoke access for ${revokeLabel}? They will no longer see your health data.`}
        confirmLabel="Revoke access"
        variant="destructive"
        isLoading={revoke.isPending}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}

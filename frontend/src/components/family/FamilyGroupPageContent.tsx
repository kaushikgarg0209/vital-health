"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, LogOut, Trash2, UserPlus } from "lucide-react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { FamilyInvitationPanel } from "@/components/family/FamilyInvitationPanel";
import { FamilyMemberRow } from "@/components/family/FamilyMemberRow";
import { GroupStatsStrip } from "@/components/family/GroupStatsStrip";
import { InviteMemberDialog } from "@/components/family/InviteMemberDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useDeleteGroup, useFamilyGroup, useRevokeMembership } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = ["pending", "accepted"] as const;

type FamilyGroupPageContentProps = {
  groupId: string;
  currentUserId: string;
};

function GroupPageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-neutral-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-xl bg-neutral-100" />
        <div className="h-20 rounded-xl bg-neutral-100" />
        <div className="h-20 rounded-xl bg-neutral-100" />
      </div>
      <div className="h-24 rounded-xl bg-neutral-100" />
      <div className="h-24 rounded-xl bg-neutral-100" />
    </div>
  );
}

function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function FamilyGroupPageContent({ groupId, currentUserId }: FamilyGroupPageContentProps) {
  const router = useRouter();
  const { data: group, isLoading, isError } = useFamilyGroup(groupId);
  const revoke = useRevokeMembership(groupId);
  const deleteGroupMutation = useDeleteGroup();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const {
    outgoing,
    incoming,
    canInvite,
    isOwner,
    viewerMembership,
    pendingInvitation,
    roleBanner,
    stats,
  } = useMemo(() => {
    if (!group) {
      return {
        outgoing: [],
        incoming: [],
        canInvite: false,
        isOwner: false,
        viewerMembership: null,
        pendingInvitation: null,
        roleBanner: null,
        stats: { activeMembers: 0, caringForCount: 0, pendingInvites: 0 },
      };
    }

    const pendingInvite = group.memberships.find(
      (membership) =>
        membership.viewerUserId === currentUserId && membership.status === "pending",
    );

    const out = group.memberships.filter(
      (membership) =>
        membership.subjectUserId === currentUserId &&
        ACTIVE_STATUSES.includes(membership.status as (typeof ACTIVE_STATUSES)[number]),
    );
    const inc = group.memberships.filter(
      (membership) =>
        membership.viewerUserId === currentUserId &&
        membership.status === "accepted" &&
        membership.subjectUserId !== currentUserId,
    );

    const owner = group.createdBy === currentUserId;
    const isSubject = out.length > 0 || owner;

    const caregiverMembership = group.memberships.find(
      (membership) =>
        membership.viewerUserId === currentUserId &&
        membership.status === "accepted" &&
        membership.subjectUserId !== currentUserId,
    );

    const acceptedCount = group.memberships.filter((m) => m.status === "accepted").length;
    const pendingOutgoing = out.filter((m) => m.status === "pending").length;

    let banner: { message: string; className: string } | null = null;

    if (pendingInvite) {
      banner = {
        message: "You have a pending invitation to join this group.",
        className: "border-amber-200 bg-amber-50 text-amber-900",
      };
    } else if (owner || isSubject) {
      banner = {
        message: "You manage this group and can invite caregivers.",
        className: "border-primary-200 bg-primary-50 text-primary-900",
      };
    } else if (caregiverMembership) {
      banner = {
        message: "You can view shared health information for members below.",
        className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      };
    }

    return {
      outgoing: out,
      incoming: inc,
      canInvite: (owner || isSubject) && !pendingInvite,
      isOwner: owner,
      viewerMembership: caregiverMembership ?? null,
      pendingInvitation: pendingInvite ?? null,
      roleBanner: banner,
      stats: {
        activeMembers: acceptedCount,
        caringForCount: inc.length,
        pendingInvites: pendingOutgoing,
      },
    };
  }, [group, currentUserId]);

  async function handleLeaveGroup() {
    if (!viewerMembership) {
      return;
    }

    await revoke.mutateAsync(viewerMembership.id);
    setLeaveConfirmOpen(false);
    router.push("/family");
  }

  async function handleDeleteGroup() {
    await deleteGroupMutation.mutateAsync(groupId);
    setDeleteConfirmOpen(false);
    router.push("/family");
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <GroupPageSkeleton />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load this family group. It may not exist or you may not have access.
        </div>
      </div>
    );
  }

  if (pendingInvitation) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <AppBreadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Family", href: "/family" },
              { label: group.name },
            ]}
          />

          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">{group.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Review the invitation below to join this family health group.
            </p>
          </div>
        </div>

        <FamilyInvitationPanel
          token={pendingInvitation.invitationToken ?? null}
          hint={{
            subjectName: pendingInvitation.subjectName,
            permissionLevel: pendingInvitation.permissionLevel,
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Family", href: "/family" },
            { label: group.name },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">{group.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Manage who can view health information in this group.
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Created {formatCreatedDate(group.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap shrink-0 gap-2">
            {canInvite ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className={cn(buttonVariants(), "rounded-xl")}
              >
                <UserPlus className="size-4" />
                Invite member
              </button>
            ) : null}

            {viewerMembership ? (
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(true)}
                disabled={revoke.isPending}
                className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
              >
                <LogOut className="size-4" />
                Leave group
              </button>
            ) : null}

            {isOwner ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleteGroupMutation.isPending}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700",
                )}
              >
                <Trash2 className="size-4" />
                Delete group
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {roleBanner ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed",
            roleBanner.className,
          )}
        >
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>{roleBanner.message}</p>
        </div>
      ) : null}

      <GroupStatsStrip
        activeMembers={stats.activeMembers}
        caringForCount={stats.caringForCount}
        pendingInvites={stats.pendingInvites}
      />

      {incoming.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">People you&apos;re caring for</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Health information shared with you in this group.
            </p>
          </div>
          {incoming.map((membership) => (
            <FamilyMemberRow
              key={membership.id}
              membership={membership}
              groupId={groupId}
              variant="incoming"
              memberUserId={membership.subjectUserId}
              memberName={membership.subjectName}
              canRevoke={false}
            />
          ))}
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">
              People you&apos;ve shared with
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Caregivers who can view your health data.
            </p>
          </div>
          {outgoing.map((membership) => (
            <FamilyMemberRow
              key={membership.id}
              membership={membership}
              groupId={groupId}
              variant="outgoing"
              memberName={membership.viewerName ?? membership.inviteeEmail ?? "Pending invite"}
              canRevoke={
                membership.status !== "revoked" &&
                (membership.subjectUserId === currentUserId ||
                  group.createdBy === currentUserId)
              }
            />
          ))}
        </section>
      ) : null}

      {incoming.length === 0 && outgoing.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-neutral-500">
            No members in this group yet. Invite someone to start sharing health information.
          </p>
          {canInvite ? (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className={cn(buttonVariants(), "mt-4 rounded-xl")}
            >
              <UserPlus className="size-4" />
              Invite member
            </button>
          ) : null}
        </div>
      ) : null}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} groupId={groupId} />

      <ConfirmDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title="Leave group?"
        description={`Leave "${group.name}"? You will no longer be able to view shared health information in this group.`}
        confirmLabel="Leave group"
        variant="destructive"
        isLoading={revoke.isPending}
        onConfirm={handleLeaveGroup}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete group?"
        description={`Delete "${group.name}" permanently? All members will lose access and this cannot be undone.`}
        confirmLabel="Delete group"
        variant="destructive"
        isLoading={deleteGroupMutation.isPending}
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}

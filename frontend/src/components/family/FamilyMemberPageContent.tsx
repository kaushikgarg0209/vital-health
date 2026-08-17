"use client";

import { useState } from "react";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { CaregiverView } from "@/components/family/CaregiverView";
import { EmergencyBrief } from "@/components/family/EmergencyBrief";
import { PermissionLevelBadge } from "@/components/family/PermissionLevelBadge";
import {
  useCaregiverSummary,
  useEmergencyBrief,
  useFamilyGroup,
} from "@/hooks/useFamily";
import { cn } from "@/lib/utils";

type FamilyMemberPageContentProps = {
  groupId: string;
  memberUserId: string;
};

type ViewTab = "overview" | "emergency";

function MemberPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-neutral-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-44 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

export function FamilyMemberPageContent({ groupId, memberUserId }: FamilyMemberPageContentProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");

  const { data: group } = useFamilyGroup(groupId);
  const membership = group?.memberships.find(
    (row) => row.subjectUserId === memberUserId && row.status === "accepted",
  );

  const permissionLevel = membership?.permissionLevel ?? "emergency";
  const memberName = membership?.subjectName ?? "Family member";
  const isEmergencyOnly = permissionLevel === "emergency";

  const summaryQuery = useCaregiverSummary(groupId, memberUserId, !isEmergencyOnly);
  const emergencyQuery = useEmergencyBrief(
    groupId,
    memberUserId,
    isEmergencyOnly || activeTab === "emergency",
  );

  const isLoading = isEmergencyOnly
    ? emergencyQuery.isLoading
    : activeTab === "emergency"
      ? emergencyQuery.isLoading
      : summaryQuery.isLoading;

  const isError = isEmergencyOnly
    ? emergencyQuery.isError
    : activeTab === "emergency"
      ? emergencyQuery.isError
      : summaryQuery.isError;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-4">
        <AppBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Family", href: "/family" },
            { label: group?.name ?? "Group", href: `/family/${groupId}` },
            { label: memberName },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">{memberName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
              Caregiver view of shared health information.
            </p>
            {membership ? (
              <div className="mt-3">
                <PermissionLevelBadge level={membership.permissionLevel} showDescription />
              </div>
            ) : null}
          </div>
        </div>

        {!isEmergencyOnly ? (
          <div className="flex gap-2 border-b border-neutral-200">
            {(
              [
                { id: "overview" as const, label: "Health overview" },
                { id: "emergency" as const, label: "Emergency brief" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-800",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? <MemberPageSkeleton /> : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load health information. You may not have permission to view this data.
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {isEmergencyOnly || activeTab === "emergency" ? (
            emergencyQuery.data ? <EmergencyBrief brief={emergencyQuery.data} /> : null
          ) : null}

          {!isEmergencyOnly && activeTab === "overview" && summaryQuery.data ? (
            <CaregiverView summary={summaryQuery.data} memberName={memberName} />
          ) : null}

          {isEmergencyOnly ? (
            <p className="text-sm text-neutral-500">
              You have emergency-only access. Ask {memberName} for monitor access to see lab trends
              and medications.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

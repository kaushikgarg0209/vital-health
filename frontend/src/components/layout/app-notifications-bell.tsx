"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import { alertTypeLabel, formatBiomarkerKey } from "@/lib/lab-utils";
import { useFamilyNotifications, useMarkFamilyNotificationRead } from "@/hooks/useFamily";
import { useLabAlerts, useLabBiomarkers, useMarkAlertRead } from "@/hooks/useLab";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import type { NotificationType } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { FamilyNotification } from "@/types/family";
import type { BiomarkerAlert } from "@/types/lab";

const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  biomarker_alert: Activity,
  family_alert: Users,
  family_invitation: UserPlus,
  document_processed: CheckCircle2,
  document_failed: XCircle,
  challenge_reminder: Target,
  badge_earned: Award,
  level_up: TrendingUp,
  plan_updated: RefreshCw,
};

type PanelItem =
  | { kind: "lab"; alert: BiomarkerAlert }
  | { kind: "family"; notification: FamilyNotification };

function familyNotificationHref(notification: FamilyNotification): string | null {
  const metadata = notification.metadata;

  if (notification.type === "family_invitation") {
    const token = metadata.token;
    if (typeof token === "string" && token.length > 0) {
      const params = new URLSearchParams({ token });
      const permissionLevel = metadata.permissionLevel;
      if (typeof permissionLevel === "string") {
        params.set("level", permissionLevel);
      }
      return `/family/accept?${params.toString()}`;
    }
    return "/family/accept";
  }

  if (notification.type === "family_alert") {
    const groupId = metadata.groupId;
    const subjectUserId = metadata.subjectUserId;
    if (typeof groupId === "string" && typeof subjectUserId === "string") {
      return `/family/${groupId}/member/${subjectUserId}`;
    }
  }

  return null;
}

export function AppNotificationsBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: labAlerts = [], isLoading: labLoading } = useLabAlerts();
  const { data: familyNotifications = [], isLoading: familyLoading } = useFamilyNotifications();
  const { data: biomarkersData } = useLabBiomarkers();
  const markLabRead = useMarkAlertRead();
  const markFamilyRead = useMarkFamilyNotificationRead();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const biomarkerMeta = useMemo(() => {
    const map = new Map<string, { displayName: string; unit: string }>();
    for (const biomarker of biomarkersData?.categories.flatMap((category) => category.biomarkers) ??
      []) {
      map.set(biomarker.biomarkerKey, {
        displayName: biomarker.displayName,
        unit: biomarker.unit,
      });
    }
    return map;
  }, [biomarkersData]);

  const items = useMemo(() => {
    const labItems: PanelItem[] = labAlerts.map((alert) => ({ kind: "lab", alert }));
    const familyItems: PanelItem[] = familyNotifications.map((notification) => ({
      kind: "family",
      notification,
    }));

    return [...labItems, ...familyItems].sort((left, right) => {
      const leftDate =
        left.kind === "lab" ? left.alert.createdAt : left.notification.createdAt;
      const rightDate =
        right.kind === "lab" ? right.alert.createdAt : right.notification.createdAt;
      return new Date(rightDate).getTime() - new Date(leftDate).getTime();
    });
  }, [labAlerts, familyNotifications]);

  useEffect(() => {
    setUnreadCount(labAlerts.length + familyNotifications.length);
  }, [labAlerts.length, familyNotifications.length, setUnreadCount]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const unreadCount = labAlerts.length + familyNotifications.length;
  const isLoading = labLoading || familyLoading;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
          <div className="border-b border-neutral-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">Notifications</h3>
            <p className="text-xs text-neutral-400">Lab alerts and family updates</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">No unread notifications</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => {
                  if (item.kind === "lab") {
                    const alert = item.alert;
                    const meta = biomarkerMeta.get(alert.biomarkerKey);
                    const displayName = meta?.displayName ?? formatBiomarkerKey(alert.biomarkerKey);
                    const unit = meta?.unit ?? "";

                    return (
                      <li key={`lab-${alert.id}`} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Activity className="size-3.5 shrink-0 text-red-500" />
                              <Link
                                href={`/lab/${alert.biomarkerKey}`}
                                onClick={() => setOpen(false)}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700"
                              >
                                {displayName}
                              </Link>
                            </div>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {alertTypeLabel(alert.alertType)}
                            </p>
                            <p className="mt-1 text-xs tabular-nums text-neutral-700">
                              {alert.previousValue ?? "—"}
                              {unit ? ` ${unit}` : ""}
                              <ArrowRight className="mx-1 inline size-3 text-neutral-400" />
                              {alert.newValue ?? "—"}
                              {unit ? ` ${unit}` : ""}
                            </p>
                            {alert.previousStatus || alert.newStatus ? (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {alert.previousStatus ? (
                                  <BiomarkerStatusBadge status={alert.previousStatus} size="sm" />
                                ) : null}
                                {alert.previousStatus && alert.newStatus ? (
                                  <ArrowRight className="size-3 text-neutral-400" />
                                ) : null}
                                {alert.newStatus ? (
                                  <BiomarkerStatusBadge status={alert.newStatus} size="sm" />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => markLabRead.mutate(alert.id)}
                            disabled={markLabRead.isPending}
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
                            aria-label="Mark alert as read"
                          >
                            <Check className="size-4" />
                          </button>
                        </div>
                      </li>
                    );
                  }

                  const notification = item.notification;
                  const Icon = NOTIFICATION_ICONS[notification.type] ?? Users;
                  const href = familyNotificationHref(notification);

                  return (
                    <li key={`family-${notification.id}`} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon className="size-3.5 shrink-0 text-amber-500" />
                            {href ? (
                              <Link
                                href={href}
                                onClick={() => setOpen(false)}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700"
                              >
                                {notification.title}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium text-neutral-800">
                                {notification.title}
                              </p>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                            {notification.body}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => markFamilyRead.mutate(notification.id)}
                          disabled={markFamilyRead.isPending}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
                          aria-label="Mark notification as read"
                        >
                          <Check className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

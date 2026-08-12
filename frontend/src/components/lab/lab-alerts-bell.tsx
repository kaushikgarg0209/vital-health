"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Check, Loader2 } from "lucide-react";
import { BiomarkerStatusBadge } from "@/components/lab/biomarker-status-badge";
import { alertTypeLabel, formatBiomarkerKey } from "@/lib/lab-utils";
import { useLabAlerts, useLabBiomarkers, useMarkAlertRead } from "@/hooks/useLab";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { cn } from "@/lib/utils";

export function LabAlertsBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: alerts = [], isLoading } = useLabAlerts();
  const { data: biomarkersData } = useLabBiomarkers();
  const markRead = useMarkAlertRead();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

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
            <h3 className="text-sm font-semibold text-neutral-800">Lab alerts</h3>
            <p className="text-xs text-neutral-400">Unread biomarker changes</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">No unread alerts</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {alerts.map((alert) => {
                  const meta = biomarkerMeta.get(alert.biomarkerKey);
                  const displayName = meta?.displayName ?? formatBiomarkerKey(alert.biomarkerKey);
                  const unit = meta?.unit ?? "";

                  return (
                    <li key={alert.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/lab/${alert.biomarkerKey}`}
                            onClick={() => setOpen(false)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            {displayName}
                          </Link>
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
                          onClick={() => markRead.mutate(alert.id)}
                          disabled={markRead.isPending}
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800",
                          )}
                          aria-label="Mark alert as read"
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

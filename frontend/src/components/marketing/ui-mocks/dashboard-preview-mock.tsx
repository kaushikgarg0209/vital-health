import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardPreviewMock() {
  return (
    <Card className="relative overflow-hidden border-neutral-200/80 shadow-xl shadow-neutral-900/5">
      <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-red-400/80" />
          <div className="size-2.5 rounded-full bg-amber-400/80" />
          <div className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs text-neutral-400">Vital Dashboard</span>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              LDL Cholesterol
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-800">
              118
              <span className="ml-1 text-base font-normal text-neutral-400">mg/dL</span>
            </p>
            <p className="mt-1 text-xs text-emerald-600">↓ 12% vs last quarter</p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              HbA1c
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-800">
              5.4
              <span className="ml-1 text-base font-normal text-neutral-400">%</span>
            </p>
            <p className="mt-1 text-xs text-emerald-600">Within target range</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Brain className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">AI Advocate insight</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                Your LDL trend is improving. Consider discussing maintenance strategies with
                your clinician at your next visit.
              </p>
              <p className="mt-2 text-xs text-primary-600">Source: Lab report · Jan 2026</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

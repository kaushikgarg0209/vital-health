import { AlertTriangle, Apple, Beef, Droplets, Flame, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NutritionTargets } from "@/types/wellness";

type MacroTargetsStripProps = {
  targets: NutritionTargets;
  className?: string;
};

export function MacroTargetsStrip({ targets, className }: MacroTargetsStripProps) {
  const stats = [
    {
      label: "Daily calories",
      value: targets.dailyCalories,
      suffix: "kcal",
      icon: Flame,
      accent: "text-orange-600 bg-orange-50",
    },
    {
      label: "Protein",
      value: targets.proteinG,
      suffix: "g",
      icon: Beef,
      accent: "text-red-600 bg-red-50",
    },
    {
      label: "Carbs",
      value: targets.carbsG,
      suffix: "g",
      icon: Wheat,
      accent: "text-amber-600 bg-amber-50",
    },
    {
      label: "Fat",
      value: targets.fatG,
      suffix: "g",
      icon: Droplets,
      accent: "text-blue-600 bg-blue-50",
    },
    {
      label: "Fiber",
      value: targets.fiberG,
      suffix: "g",
      icon: Apple,
      accent: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">BMI</p>
          <p className="mt-1 text-lg font-semibold text-neutral-800">
            {targets.bmi}{" "}
            <span className="text-sm font-normal capitalize text-neutral-500">
              ({targets.bmiCategory})
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Maintenance (TDEE)
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-800">{targets.tdee} kcal</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm"
          >
            <div className={cn("flex size-10 items-center justify-center rounded-xl", stat.accent)}>
              <stat.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-neutral-800">
                {stat.value}
                <span className="ml-1 text-sm font-normal text-neutral-500">{stat.suffix}</span>
              </p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-neutral-500">{targets.rationale}</p>

      {targets.labAdjustments.length > 0 ? (
        <ul className="space-y-2">
          {targets.labAdjustments.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function NutritionSummaryCard({ targets }: { targets: NutritionTargets }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-800">Body metrics</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">BMI</dt>
          <dd className="font-medium text-neutral-800">
            {targets.bmi} ({targets.bmiCategory})
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">TDEE</dt>
          <dd className="font-medium text-neutral-800">{targets.tdee} kcal</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Daily target</dt>
          <dd className="font-medium text-neutral-800">{targets.dailyCalories} kcal</dd>
        </div>
      </dl>
    </div>
  );
}

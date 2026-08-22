"use client";

import { useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Coffee,
  Moon,
  Quote,
  Salad,
  Sparkles,
  Sun,
  Utensils,
} from "lucide-react";
import { MacroTargetsStrip } from "@/components/fitness/MacroTargetsStrip";
import { WeeklyCheckInDialog } from "@/components/fitness/WeeklyCheckInDialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { usePlanCheckins } from "@/hooks/useWellness";
import { parseCoachFeedback } from "@/lib/wellness/coachFeedback";
import { cn } from "@/lib/utils";
import {
  DAY_OF_WEEK_LABELS,
  DAYS_OF_WEEK,
  MEAL_SLOT_LABELS,
  type DayOfWeek,
  type MealSlot,
  type MealSuggestion,
  type WellnessPlan,
  type WellnessPlanWeek,
  type WeeklyCheckin,
} from "@/types/wellness";

type WellnessPlanViewProps = {
  plan: WellnessPlan;
  checkins: WeeklyCheckin[];
};

const MEAL_ICONS: Record<MealSlot, typeof Sun> = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Coffee,
};

const MEAL_BORDER: Record<MealSlot, string> = {
  breakfast: "border-l-amber-400",
  lunch: "border-l-emerald-400",
  dinner: "border-l-indigo-400",
  snack: "border-l-orange-300",
};

function getTodayDayOfWeek(): DayOfWeek {
  const index = new Date().getDay();
  const days: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[index] ?? "monday";
}

export function WellnessPlanView({ plan, checkins }: WellnessPlanViewProps) {
  const [expandedWeek, setExpandedWeek] = useState(plan.currentWeek);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [checkinOpen, setCheckinOpen] = useState(false);
  const { data: refreshedCheckins = checkins } = usePlanCheckins(plan.id);

  const checkinByWeek = new Map(refreshedCheckins.map((item) => [item.weekNumber, item]));
  const latestFeedback = [...refreshedCheckins]
    .sort((a, b) => b.weekNumber - a.weekNumber)
    .find((item) => item.aiFeedback);

  const coachFeedback = latestFeedback
    ? parseCoachFeedback(latestFeedback.aiFeedback, latestFeedback.adjustedTargets)
    : null;

  const canCheckIn =
    plan.status === "active" &&
    plan.currentWeek <= 4 &&
    !checkinByWeek.has(plan.currentWeek);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary-600" />
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Your personalized plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-800">{plan.plan.overview}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-800">Daily nutrition targets</h2>
        <MacroTargetsStrip targets={plan.nutritionTargets} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">4-week plan</h2>
            <p className="text-sm text-neutral-500">
              Currently on week {Math.min(plan.currentWeek, 4)} of 4
            </p>
          </div>
          {canCheckIn ? (
            <button
              type="button"
              onClick={() => setCheckinOpen(true)}
              className={cn(buttonVariants(), "rounded-xl")}
            >
              Check in for week {plan.currentWeek}
            </button>
          ) : null}
        </div>

        {coachFeedback ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <Quote className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Coach feedback — week {latestFeedback!.weekNumber}</p>
                <p className="mt-1 leading-relaxed">{coachFeedback.feedback}</p>
                {coachFeedback.adjustment ? (
                  <p className="mt-2 text-emerald-700">
                    <span className="font-medium">Next week:</span> {coachFeedback.adjustment}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {plan.plan.weeks.map((week) => {
            const isExpanded = expandedWeek === week.weekNumber;
            const weekCheckin = checkinByWeek.get(week.weekNumber);
            const isCompleted = Boolean(weekCheckin) || week.weekNumber < plan.currentWeek;
            const isCurrent = week.weekNumber === plan.currentWeek && plan.status === "active";

            return (
              <div
                key={week.weekNumber}
                className={cn(
                  "overflow-hidden rounded-xl border bg-white shadow-sm",
                  isCurrent ? "border-primary-200 ring-1 ring-primary-100" : "border-neutral-100",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedWeek(isExpanded ? -1 : week.weekNumber)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-800">Week {week.weekNumber}</p>
                      {isCompleted ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          Completed
                        </Badge>
                      ) : null}
                      {isCurrent ? (
                        <Badge variant="outline" className="border-primary-200 bg-primary-50 text-primary-700">
                          Current
                        </Badge>
                      ) : null}
                      {!isCompleted && !isCurrent ? (
                        <Badge variant="outline" className="text-neutral-500">
                          Upcoming
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{week.milestone}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-neutral-400" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-neutral-400" />
                  )}
                </button>

                {isExpanded ? (
                  <div className="space-y-4 border-t border-neutral-100 px-4 py-4">
                    <PlanBlock icon={Activity} title="Activity" content={week.activityTarget} />
                    <PlanBlock icon={Salad} title="Diet guidance" content={week.dietaryGuidance} />
                    <PlanBlock icon={Moon} title="Sleep" content={week.sleepTarget} />

                    <WeekMealsSection
                      week={week}
                      selectedDay={selectedDay}
                      onSelectDay={setSelectedDay}
                    />

                    {weekCheckin ? (
                      <div className="rounded-lg bg-neutral-50 px-3 py-3 text-sm text-neutral-600">
                        Check-in submitted — adherence {weekCheckin.adherenceScore}/5, energy{" "}
                        {weekCheckin.energyLevel}/5
                      </div>
                    ) : null}

                    {isCurrent && canCheckIn ? (
                      <button
                        type="button"
                        onClick={() => setCheckinOpen(true)}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-xl")}
                      >
                        Submit week {week.weekNumber} check-in
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <WeeklyCheckInDialog
        open={checkinOpen}
        onOpenChange={setCheckinOpen}
        planId={plan.id}
        weekNumber={plan.currentWeek}
      />
    </div>
  );
}

function WeekMealsSection({
  week,
  selectedDay,
  onSelectDay,
}: {
  week: WellnessPlanWeek;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
}) {
  if (week.dailyMealPlans && week.dailyMealPlans.length > 0) {
    const activeDay =
      week.dailyMealPlans.find((item) => item.day === selectedDay) ?? week.dailyMealPlans[0];

    return (
      <div>
        <h4 className="text-sm font-semibold text-neutral-800">Daily meals</h4>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((day) => {
            const hasPlan = week.dailyMealPlans!.some((item) => item.day === day);
            if (!hasPlan) {
              return null;
            }

            return (
              <button
                key={`${week.weekNumber}-${day}`}
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedDay === day
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {DAY_OF_WEEK_LABELS[day]}
              </button>
            );
          })}
        </div>
        <MealCards meals={activeDay?.meals ?? []} weekNumber={week.weekNumber} day={activeDay?.day} />
      </div>
    );
  }

  if (week.mealSuggestions && week.mealSuggestions.length > 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-neutral-800">Meal suggestions</h4>
        <p className="mt-1 text-xs text-neutral-500">
          Regenerate your plan for a 7-day menu.
        </p>
        <MealCards meals={week.mealSuggestions} weekNumber={week.weekNumber} />
      </div>
    );
  }

  return null;
}

function MealCards({
  meals,
  weekNumber,
  day,
}: {
  meals: MealSuggestion[];
  weekNumber: number;
  day?: DayOfWeek;
}) {
  return (
    <div className="mt-3 grid gap-3">
      {meals.map((meal) => {
        const Icon = MEAL_ICONS[meal.meal];
        return (
          <div
            key={`${weekNumber}-${day ?? "legacy"}-${meal.meal}-${meal.suggestion}`}
            className={cn(
              "rounded-lg border border-neutral-100 border-l-4 bg-neutral-25 px-3 py-3",
              MEAL_BORDER[meal.meal],
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-neutral-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {MEAL_SLOT_LABELS[meal.meal]}
              </p>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-800">{meal.suggestion}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{meal.why}</p>
          </div>
        );
      })}
    </div>
  );
}

function PlanBlock({
  icon: Icon,
  title,
  content,
}: {
  icon: typeof Activity;
  title: string;
  content: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500">
        <Icon className="size-4" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-neutral-800">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{content}</p>
      </div>
    </div>
  );
}

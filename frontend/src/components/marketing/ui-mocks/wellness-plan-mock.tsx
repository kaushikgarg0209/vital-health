import { Badge } from "@/components/ui/badge";

const macros = [
  { label: "Calories", value: "2,050" },
  { label: "Protein", value: "128g" },
  { label: "Carbs", value: "210g" },
  { label: "Fat", value: "68g" },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WellnessPlanMock() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-800">4-week wellness plan</p>
          <p className="text-sm text-neutral-500">Week 2 · Personalized from your labs</p>
        </div>
        <Badge variant="outline" className="border-primary-200 bg-primary-50 text-primary-700">
          Active
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {macros.map((macro) => (
          <div
            key={macro.label}
            className="rounded-lg border border-neutral-100 bg-neutral-25 px-3 py-2 text-center"
          >
            <p className="text-xs text-neutral-500">{macro.label}</p>
            <p className="text-sm font-semibold text-neutral-800">{macro.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {days.map((day, index) => (
          <span
            key={day}
            className={
              index === 0
                ? "rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-medium text-white"
                : "rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600"
            }
          >
            {day}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="rounded-lg border border-neutral-100 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Breakfast</p>
          <p className="text-neutral-800">Vegetable upma with sprouted moong and curd</p>
        </div>
        <div className="rounded-lg border border-neutral-100 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Lunch</p>
          <p className="text-neutral-800">Brown rice, dal, mixed vegetable sabzi</p>
        </div>
      </div>
    </div>
  );
}

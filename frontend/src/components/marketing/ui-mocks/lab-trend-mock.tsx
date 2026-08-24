import { Badge } from "@/components/ui/badge";

const bars = [72, 68, 65, 62, 58, 55, 52];

export function LabTrendMock() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            LDL Cholesterol
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-800">
            118 <span className="text-sm font-normal text-neutral-400">mg/dL</span>
          </p>
        </div>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          Borderline
        </Badge>
      </div>
      <div className="mt-6 flex h-24 items-end gap-2">
        {bars.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-primary-200"
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] text-neutral-400">Q{index + 1}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-emerald-600">Trending down 12% over 18 months</p>
    </div>
  );
}

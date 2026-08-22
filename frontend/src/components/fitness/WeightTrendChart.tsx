"use client";

import { Scale } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightMeasurement } from "@/types/wellness";

type WeightTrendChartProps = {
  measurements: WeightMeasurement[];
};

type ChartPoint = {
  id: string;
  label: string;
  weightKg: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-neutral-800">{point.weightKg} kg</p>
      <p className="text-neutral-500">{point.label}</p>
    </div>
  );
}

export function WeightTrendChart({ measurements }: WeightTrendChartProps) {
  const sorted = [...measurements]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-12);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400">
          <Scale className="size-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-neutral-700">No weight data yet</p>
        <p className="mt-1 text-xs text-neutral-500">
          Log your weight during weekly check-ins to see your trend.
        </p>
      </div>
    );
  }

  const chartData: ChartPoint[] = sorted.map((entry) => ({
    id: entry.id,
    label: entry.recordedAt.slice(0, 10),
    weightKg: entry.weightKg,
  }));

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Weight trend</h3>
          <p className="text-xs text-neutral-500">Last {sorted.length} measurements</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-neutral-800">
          {sorted[sorted.length - 1]?.weightKg} kg
        </p>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="var(--color-primary-600, #2563eb)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-primary-600, #2563eb)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

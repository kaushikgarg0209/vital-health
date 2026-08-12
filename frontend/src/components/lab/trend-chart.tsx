"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildChartLabels,
  compareLabReadings,
  filterReadingsByRange,
  formatLabDate,
  sourceLabel,
} from "@/lib/lab-utils";
import { biomarkerStatus } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ChartTimeRange, LabReading } from "@/types/lab";

type TrendChartProps = {
  readings: LabReading[];
  unit: string;
  referenceRange: { low: number | null; high: number | null } | null;
  className?: string;
};

const TIME_RANGES: ChartTimeRange[] = ["3M", "6M", "1Y", "ALL"];

type ChartPoint = {
  id: string;
  date: string;
  label: string;
  value: number;
  source: LabReading["source"];
  status: LabReading["status"];
};

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  unit: string;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-neutral-800">
        {point.value} {unit}
      </p>
      <p className="mt-0.5 text-neutral-500">{formatLabDate(point.date)}</p>
      <p className="text-neutral-400">{sourceLabel(point.source)}</p>
    </div>
  );
}

export function TrendChart({ readings, unit, referenceRange, className }: TrendChartProps) {
  const [range, setRange] = useState<ChartTimeRange>("ALL");

  const filtered = useMemo(
    () => filterReadingsByRange(readings, range),
    [readings, range],
  );

  const chartData = useMemo<ChartPoint[]>(() => {
    const sorted = [...filtered].sort((left, right) => compareLabReadings(left, right, "asc"));
    const labels = buildChartLabels(sorted);

    return sorted.map((reading) => ({
      id: reading.id,
      date: reading.readingDate,
      label: labels.get(reading.id) ?? formatLabDate(reading.readingDate),
      value: reading.value,
      source: reading.source,
      status: reading.status,
    }));
  }, [filtered]);

  const hasSameDayPoints = useMemo(() => {
    const dates = filtered.map((reading) => reading.readingDate);
    return new Set(dates).size < dates.length;
  }, [filtered]);

  const latestStatus = chartData[chartData.length - 1]?.status ?? null;
  const stroke = latestStatus ? biomarkerStatus[latestStatus].chartColor : "#2563EB";

  const yDomain = useMemo(() => {
    const values = chartData.map((point) => point.value);
    const lows = referenceRange?.low != null ? [referenceRange.low] : [];
    const highs = referenceRange?.high != null ? [referenceRange.high] : [];
    const all = [...values, ...lows, ...highs];

    if (all.length === 0) {
      return [0, 100];
    }

    const min = Math.min(...all);
    const max = Math.max(...all);
    const padding = Math.max((max - min) * 0.15, 5);

    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData, referenceRange]);

  if (chartData.length === 0) {
    return (
      <div className={cn("rounded-xl border border-neutral-100 bg-white p-6", className)}>
        <p className="text-sm text-neutral-500">No readings in this time range.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-neutral-100 bg-white p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-neutral-700">Trend over time</h3>
        <div className="flex gap-1 rounded-lg bg-neutral-50 p-1">
          {TIME_RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === option
                  ? "bg-white text-neutral-800 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(value: number) => `${value}`}
          />
          {referenceRange?.low != null && referenceRange?.high != null ? (
            <ReferenceArea
              y1={referenceRange.low}
              y2={referenceRange.high}
              fill="#10B981"
              fillOpacity={0.08}
              strokeOpacity={0}
            />
          ) : null}
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Line
            type={hasSameDayPoints ? "linear" : "monotone"}
            dataKey="value"
            stroke={stroke}
            strokeWidth={2.5}
            dot={{ r: 4, fill: stroke, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: stroke }}
          />
        </LineChart>
      </ResponsiveContainer>

      {referenceRange?.low != null && referenceRange?.high != null ? (
        <p className="mt-2 text-center text-xs text-neutral-400">
          Shaded band shows your reference range ({referenceRange.low}–{referenceRange.high}{" "}
          {unit})
        </p>
      ) : null}
    </div>
  );
}

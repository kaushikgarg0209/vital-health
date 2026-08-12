"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import { biomarkerStatus, type BiomarkerStatus } from "@/lib/tokens";
import type { RecentReadingPoint } from "@/types/lab";

type BiomarkerSparklineProps = {
  points: RecentReadingPoint[];
  status: BiomarkerStatus | null;
  className?: string;
};

export function BiomarkerSparkline({ points, status, className }: BiomarkerSparklineProps) {
  if (points.length < 2) {
    return (
      <div
        className={className}
        aria-hidden
      >
        <div className="flex h-10 items-center justify-center text-xs text-neutral-300">
          —
        </div>
      </div>
    );
  }

  const stroke = status ? biomarkerStatus[status].chartColor : "#94A3B8";
  const data = points.map((point, index) => ({
    index,
    value: point.value,
  }));

  return (
    <div className={className} aria-hidden>
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

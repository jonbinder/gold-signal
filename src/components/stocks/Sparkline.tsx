"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
}

export function Sparkline({ data }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="stocks-sparkline" aria-hidden="true">
      <ResponsiveContainer width={120} height={40}>
        <LineChart data={chartData} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="#2dd4bf"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InstitutionalTrendPoint } from "@/lib/stock-detail/chart-data";
import { CHART } from "@/components/charts/chart-theme";
import { ChartCaption } from "@/components/charts/ChartCaption";

export function InstitutionalTrendChart({ data }: { data: InstitutionalTrendPoint[] }) {
  return (
    <div className="gs-chart gs-chart--line">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="periodLabel"
            tick={{ fill: CHART.label, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: CHART.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: `1px solid ${CHART.grid}`,
              fontSize: 12,
            }}
            formatter={(value) => [`${value ?? 0} holders`, "Tracked funds"]}
            labelFormatter={(label) => String(label)}
          />
          <Line
            type="monotone"
            dataKey="holderCount"
            stroke={CHART.institutional}
            strokeWidth={2.5}
            dot={{ r: 3, fill: CHART.institutional, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>
        A rising line suggests accumulation by tracked funds over recent quarters; a falling line
        can signal distribution — always cross-check with individual fund changes.
      </ChartCaption>
      {data.length < 4 ? (
        <p className="gs-chart-note">
          Showing {data.length} quarter{data.length === 1 ? "" : "s"} on file — trend fills in as
          more 13F periods are synced.
        </p>
      ) : null}
    </div>
  );
}

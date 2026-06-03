"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { TwelveMonthXAxis } from "@/components/charts/TwelveMonthXAxis";
import type { MonthlyInsiderBar } from "@/lib/charts/insider-series";
import { CHART } from "@/components/charts/chart-theme";
import { ChartCaption } from "@/components/charts/ChartCaption";

function formatAxis(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  if (abs >= 1) return `$${Math.round(v)}`;
  return String(Math.round(v));
}

type TooltipPayload = { payload?: MonthlyInsiderBar };

function InsiderTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const p = payload[0].payload;
  return (
    <div className="gs-chart-tooltip">
      <p className="gs-chart-tooltip__title">{p.monthLabel}</p>
      {p.buyUsd > 0 ? (
        <p className="gs-chart-tooltip__buy">Buys: {formatAxis(p.buyUsd)}</p>
      ) : null}
      {p.sellUsd > 0 ? (
        <p className="gs-chart-tooltip__sell">Sells: {formatAxis(p.sellUsd)}</p>
      ) : null}
    </div>
  );
}

export function InsiderTimelineChart({ data }: { data: MonthlyInsiderBar[] }) {
  const chartData = data.map((m) => ({
    ...m,
    barValue: m.netUsd,
  }));

  return (
    <div className="gs-chart gs-chart--timeline">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <ReferenceLine y={0} stroke={CHART.axis} strokeWidth={1} />
          <TwelveMonthXAxis />
          <YAxis
            tickFormatter={formatAxis}
            tick={{ fill: CHART.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<InsiderTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
          <Bar dataKey="barValue" radius={[3, 3, 3, 3]} maxBarSize={28}>
            {chartData.map((entry) => (
              <Cell
                key={entry.monthKey}
                fill={entry.barValue >= 0 ? CHART.buy : CHART.sell}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartCaption>
        Notice clusters of green bars above the line — that&apos;s insider buying stacking up in the
        same window. Red below the line is selling pressure.
      </ChartCaption>
    </div>
  );
}

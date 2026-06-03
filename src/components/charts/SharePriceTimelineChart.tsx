"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import type { PriceTimelinePoint } from "@/lib/charts/price-series";
import { CHART } from "@/components/charts/chart-theme";
import { ChartCaption } from "@/components/charts/ChartCaption";
import { TwelveMonthXAxis } from "@/components/charts/TwelveMonthXAxis";

function formatPrice(v: number): string {
  if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v >= 100) return `$${v.toFixed(1)}`;
  return `$${v.toFixed(2)}`;
}

type TooltipPayload = { payload?: PriceTimelinePoint };

function PriceTooltip({
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
      <p className="gs-chart-tooltip__title">{p.date}</p>
      <p className="gs-chart-tooltip__buy" style={{ color: CHART.institutional }}>
        Close {formatPrice(p.close)}
      </p>
    </div>
  );
}

export function SharePriceTimelineChart({ data }: { data: PriceTimelinePoint[] }) {
  return (
    <div className="gs-chart gs-chart--price-line">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <TwelveMonthXAxis />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fill: CHART.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<PriceTooltip />} cursor={{ stroke: CHART.muted, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="close"
            stroke={CHART.institutional}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: CHART.institutional, stroke: "#fff", strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>
        Compare price moves above with insider buying and selling below.
      </ChartCaption>
    </div>
  );
}

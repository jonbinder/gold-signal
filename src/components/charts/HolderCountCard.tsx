"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { HolderCountSnapshot } from "@/lib/stock-detail/chart-data";
import { CHART } from "@/components/charts/chart-theme";
import { ChartCaption } from "@/components/charts/ChartCaption";

function trendLabel(current: number, prior: number | null): string | null {
  if (prior == null) return null;
  if (current > prior) return `up from ${prior}`;
  if (current < prior) return `down from ${prior}`;
  return `unchanged from ${prior}`;
}

export function HolderCountCard({ snapshot }: { snapshot: HolderCountSnapshot }) {
  const trend = trendLabel(snapshot.current, snapshot.prior);
  const sparkData = snapshot.sparkline.map((count, i) => ({ i, count }));

  return (
    <div className="gs-holder-card">
      <div className="gs-holder-card__main">
        <p className="gs-holder-card__count mono">
          <span className="gs-holder-card__number">{snapshot.current}</span>
          <span className="gs-holder-card__label">
            tracked fund{snapshot.current === 1 ? "" : "s"} holding
          </span>
        </p>
        {trend ? (
          <p className="gs-holder-card__trend">
            {trend}
            {snapshot.priorPeriodLabel ? (
              <span className="gs-holder-card__trend-ref">
                {" "}
                vs {snapshot.priorPeriodLabel}
              </span>
            ) : null}
          </p>
        ) : null}
        {snapshot.periodLabel ? (
          <p className="gs-holder-card__period mono">As of {snapshot.periodLabel}</p>
        ) : null}
      </div>
      {sparkData.length >= 2 ? (
        <div className="gs-holder-card__spark" aria-hidden>
          <ResponsiveContainer width="100%" height={48}>
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="count"
                stroke={CHART.institutional}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <ChartCaption>
        More tracked funds holding the name usually means broader institutional interest — watch
        whether the count trends up quarter over quarter.
      </ChartCaption>
    </div>
  );
}

"use client";

import { XAxis } from "recharts";
import { labelForMonthIndex, TWELVE_MONTH_X_DOMAIN, twelveMonthBarCenters } from "@/lib/charts/price-series";
import { recentMonthKeys } from "@/lib/charts/insider-series";
import { CHART } from "@/components/charts/chart-theme";

type Props = {
  monthCount?: number;
};

/** Shared 12-month numeric axis so price line and insider bars align visually. */
export function TwelveMonthXAxis({ monthCount = 12 }: Props) {
  const monthKeys = recentMonthKeys(monthCount);
  const ticks = twelveMonthBarCenters(monthCount);

  return (
    <XAxis
      type="number"
      dataKey="monthIndex"
      domain={TWELVE_MONTH_X_DOMAIN}
      ticks={ticks}
      tickFormatter={(v) => labelForMonthIndex(Number(v), monthKeys)}
      tick={{ fill: CHART.label, fontSize: 11 }}
      tickLine={false}
      axisLine={{ stroke: CHART.grid }}
      allowDecimals={false}
    />
  );
}

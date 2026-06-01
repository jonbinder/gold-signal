"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ConcentrationSlice } from "@/lib/stock-detail/chart-data";
import { formatUsdCompact } from "@/lib/whats-new/format";
import { CHART } from "@/components/charts/chart-theme";
import { ChartCaption } from "@/components/charts/ChartCaption";

export function InstitutionalConcentrationDonut({ data }: { data: ConcentrationSlice }) {
  const slices = [
    { name: "Tracked funds", value: data.trackedUsd, pct: data.trackedPct, color: CHART.institutional },
    { name: "Other filers in DB", value: data.otherUsd, pct: data.otherPct, color: CHART.other },
  ].filter((s) => s.value > 0);

  if (slices.length === 0) return null;

  return (
    <div className="gs-chart gs-chart--donut">
      <div className="gs-donut-layout">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const v = typeof value === "number" ? value : 0;
                const payload = item?.payload as { pct?: number; name?: string };
                const pct = payload?.pct ?? 0;
                return [`${formatUsdCompact(v)} (${pct}%)`, payload?.name ?? ""];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="gs-donut-legend">
          {slices.map((s) => (
            <li key={s.name}>
              <span className="gs-donut-legend__swatch" style={{ background: s.color }} />
              <span className="gs-donut-legend__name">{s.name}</span>
              <span className="gs-donut-legend__pct mono">{s.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
      <ChartCaption>
        Higher concentration among tracked precious-metals funds can mean stronger specialist
        conviction — this slice only reflects 13F positions in our database, not total float.
      </ChartCaption>
    </div>
  );
}

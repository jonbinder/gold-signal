import type { CSSProperties } from "react";
import Link from "next/link";
import type { SectorInsiderHeatmapModel } from "@/lib/home/sector-heatmap";
import { ChartCaption } from "@/components/charts/ChartCaption";
import { ChartEmpty } from "@/components/charts/ChartCaption";

function cellStyle(intensity: number, hasActivity: boolean): CSSProperties {
  if (!hasActivity) {
    return { background: "var(--bg-raised)", opacity: 0.85 };
  }
  if (intensity > 0.15) {
    const t = Math.min(1, intensity);
    return { background: `rgba(21, 128, 61, ${0.2 + t * 0.65})` };
  }
  if (intensity < -0.15) {
    const t = Math.min(1, Math.abs(intensity));
    return { background: `rgba(185, 28, 28, ${0.15 + t * 0.55})` };
  }
  return { background: "var(--silver-200)" };
}

export function SectorInsiderHeatmap({ model }: { model: SectorInsiderHeatmapModel }) {
  if (model.rows.length === 0) {
    return (
      <section className="sector-heatmap" aria-labelledby="sector-heatmap-title">
        <header className="sector-heatmap__header">
          <h2 id="sector-heatmap-title" className="sector-heatmap__title">
            Sector insider activity
          </h2>
          <p className="sector-heatmap__sub">
            Monthly Form 4 buying vs selling across our tracked universe
          </p>
        </header>
        <ChartEmpty message="Not enough insider data to chart yet — check back after the next cache refresh." />
      </section>
    );
  }

  return (
    <section className="sector-heatmap" aria-labelledby="sector-heatmap-title">
      <header className="sector-heatmap__header">
        <h2 id="sector-heatmap-title" className="sector-heatmap__title">
          Sector insider activity
        </h2>
        <p className="sector-heatmap__sub">
          Last {model.monthKeys.length} months · darker green = more buying, red = selling
          {model.limited ? ` · top ${model.rows.length} by activity` : ""}
        </p>
      </header>

      <div className="sector-heatmap__scroll">
        <table className="sector-heatmap__table">
          <thead>
            <tr>
              <th scope="col" className="sector-heatmap__stock-col">
                Stock
              </th>
              {model.monthLabels.map((label, i) => (
                <th key={model.monthKeys[i]} scope="col" className="sector-heatmap__month-col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row.ticker}>
                <th scope="row" className="sector-heatmap__stock-col">
                  {row.stockHref ? (
                    <Link href={row.stockHref} className="sector-heatmap__ticker mono">
                      {row.ticker}
                    </Link>
                  ) : (
                    <span className="sector-heatmap__ticker mono sector-heatmap__ticker--muted">
                      {row.ticker}
                    </span>
                  )}
                  <span className="sector-heatmap__name">{row.name}</span>
                </th>
                {row.cells.map((cell) => {
                  const active = cell.buyUsd + cell.sellUsd > 0;
                  return (
                    <td key={cell.monthKey}>
                      <span
                        className="sector-heatmap__cell"
                        style={cellStyle(cell.intensity, active)}
                        title={
                          active
                            ? `${row.ticker} ${cell.monthKey}: buys ${Math.round(cell.buyUsd)}, sells ${Math.round(cell.sellUsd)}`
                            : "No activity"
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChartCaption>
        Scan across a row to see when insiders were active — bright green patches are where
        teaching moments often cluster (&quot;here&apos;s what&apos;s hot right now&quot;).
      </ChartCaption>
    </section>
  );
}

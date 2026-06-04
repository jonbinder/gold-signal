"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/stocks/StockLogo";
import { stockPath } from "@/lib/paths";
import type { CachedDisplayStock } from "@/lib/stock-cache";

export type ReturnWindow = "1m" | "3m" | "1y";

const WINDOW_OPTIONS: Array<{ key: ReturnWindow; label: string }> = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "1y", label: "1Y" },
];

function returnForWindow(stock: CachedDisplayStock, window: ReturnWindow): number | null {
  if (window === "1m") return stock.return1mPct;
  if (window === "1y") return stock.return1yPct;
  return stock.return3mPct;
}

function formatReturn(pct: number | null): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

type StockWithReturn = CachedDisplayStock & { returnPct: number };

function MoversList({
  title,
  stocks,
  tone,
}: {
  title: string;
  stocks: StockWithReturn[];
  tone: "up" | "down";
}) {
  return (
    <div className={`stocks-movers__col stocks-movers__col--${tone}`}>
      <h3 className="stocks-movers__col-title">{title}</h3>
      {stocks.length === 0 ? (
        <p className="stocks-movers__empty">No data for this window yet.</p>
      ) : (
        <ol className="stocks-movers__list">
          {stocks.map((stock, i) => {
            const pct = stock.returnPct;
            return (
              <li key={stock.ticker} className="stocks-movers__item">
                <span className="stocks-movers__rank mono">{i + 1}</span>
                <StockLogo
                  ticker={stock.ticker}
                  logoUrl={stock.logoUrl}
                  subCategory={stock.subCategory}
                  size={28}
                />
                <div className="stocks-movers__identity">
                  <Link href={stockPath(stock.ticker)} className="stocks-movers__ticker mono">
                    {stock.ticker}
                  </Link>
                  <Link href={stockPath(stock.ticker)} className="stocks-movers__name">
                    {stock.name}
                  </Link>
                </div>
                <span
                  className={`stocks-movers__pct tabular-nums stocks-movers__pct--${tone}`}
                  aria-label={`${formatReturn(pct)} change`}
                >
                  {formatReturn(pct)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function TopMoversPanel({ stocks }: { stocks: CachedDisplayStock[] }) {
  const [window, setWindow] = useState<ReturnWindow>("3m");

  const { gainers, losers } = useMemo(() => {
    const withReturn: StockWithReturn[] = stocks
      .map((s) => {
        const pct = returnForWindow(s, window);
        return pct != null && Number.isFinite(pct) ? { ...s, returnPct: pct } : null;
      })
      .filter((s): s is StockWithReturn => s != null);

    const sorted = [...withReturn].sort((a, b) => b.returnPct - a.returnPct);
    const gainers = sorted.filter((s) => s.returnPct > 0).slice(0, 8);
    const losers = [...sorted]
      .filter((s) => s.returnPct < 0)
      .sort((a, b) => a.returnPct - b.returnPct)
      .slice(0, 8);
    return { gainers, losers };
  }, [stocks, window]);

  return (
    <section className="stocks-movers" aria-labelledby="stocks-movers-heading">
      <div className="stocks-list-toolbar">
        <div className="stocks-list-toolbar__group">
          <span className="stocks-list-toolbar__label" id="stocks-movers-period-label">
            Period
          </span>
          <div className="stocks-list-sort" role="group" aria-labelledby="stocks-movers-period-label">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`stocks-list-sort__btn ${window === opt.key ? "stocks-list-sort__btn--active" : ""}`}
                onClick={() => setWindow(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="stocks-list-toolbar__count">
          {gainers.length + losers.length} names with cached returns
        </p>
      </div>
      <h2 id="stocks-movers-heading" className="sr-only">
        Top movers
      </h2>
      <div className="stocks-movers__grid">
        <MoversList title="Best performers" stocks={gainers} tone="up" />
        <MoversList title="Worst performers" stocks={losers} tone="down" />
      </div>
      <p className="stocks-movers__disclaimer">
        Price change vs ~{window === "1m" ? "1 month" : window === "3m" ? "3 months" : "1 year"} ago
        from cached daily history. Not investment advice.
      </p>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { stockPath } from "@/lib/paths";
import type { CachedDisplayStock } from "@/lib/stock-cache";
import { formatHolderCount } from "@/lib/stock-facts-format";

type SortKey = "ticker" | "holderCount" | "marketCap";

interface StocksTableProps {
  stocks: CachedDisplayStock[];
}

function formatMarketCap(valueUsd: number | null): string {
  if (valueUsd == null || !Number.isFinite(valueUsd) || valueUsd <= 0) return "—";
  if (valueUsd >= 1_000_000_000_000) return `$${(valueUsd / 1_000_000_000_000).toFixed(2)}T`;
  if (valueUsd >= 1_000_000_000) return `$${(valueUsd / 1_000_000_000).toFixed(1)}B`;
  if (valueUsd >= 1_000_000) return `$${Math.round(valueUsd / 1_000_000)}M`;
  return `$${Math.round(valueUsd).toLocaleString()}`;
}

const MOBILE_SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "ticker", label: "Ticker A-Z" },
  { key: "marketCap", label: "Market cap" },
  { key: "holderCount", label: "Tracked investors" },
];

function sortValue(stock: CachedDisplayStock, key: SortKey): number | string {
  if (key === "ticker") return stock.ticker;
  if (key === "holderCount") return stock.famousHolderCount ?? -1;
  return stock.marketCap ?? -1;
}

export function StocksTable({ stocks }: StocksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const list = [...stocks];
    list.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      return sortDir === "desc"
        ? (bv as number) - (av as number)
        : (av as number) - (bv as number);
    });
    return list;
  }, [stocks, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "ticker" ? "asc" : "desc");
    }
  };

  return (
    <>
      <section className="stocks-list-hero" aria-labelledby="stocks-list-heading">
        <div className="stocks-list-hero__inner">
          <p className="stocks-list-hero__eyebrow mono">Universe</p>
          <h1 id="stocks-list-heading" className="stocks-list-hero__title">
            Gold &amp; silver stocks
          </h1>
          <p className="hero-tagline">The smart money in gold and silver</p>
          <p className="stocks-list-hero__sub">
            {stocks.length} tracked names — SEC filings, institutional holders, and market cap from
            cached Polygon reference data.
          </p>
        </div>
      </section>

      <div className="stocks-list-main">
        <div className="stocks-list-sort" role="group" aria-label="Sort stocks">
          {MOBILE_SORT_OPTIONS.map((opt) => {
            const active = sortKey === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                className={`stocks-list-sort__btn ${active ? "stocks-list-sort__btn--active" : ""}`}
                aria-pressed={active}
                onClick={() => setSort(opt.key)}
              >
                {active ? (sortDir === "desc" ? "▼ " : "▲ ") : null}
                {opt.label}
              </button>
            );
          })}
        </div>

        {sorted.length === 0 ? (
          <p className="stocks-list-empty">No tracked stocks yet.</p>
        ) : (
          <>
            <div className="stocks-list-table-wrap">
              <table className="stocks-table stocks-table--facts stocks-list-table">
                <thead>
                  <tr>
                    <SortHeader
                      label="Ticker"
                      sortKey="ticker"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <th className="stocks-table__th" scope="col">
                      Company
                    </th>
                    <SortHeader
                      label="Market Cap"
                      sortKey="marketCap"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <SortHeader
                      label="# Tracked Investors"
                      sortKey="holderCount"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((stock) => (
                    <StockTableRow key={stock.ticker} stock={stock} />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="stocks-list-cards" aria-label="Stocks list">
              {sorted.map((stock) => (
                <li key={stock.ticker}>
                  <StockCard stock={stock} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = active === sortKey;
  return (
    <th
      className={`stocks-table__th stocks-table__th--sort ${isActive ? "stocks-table__th--active" : ""}`}
      scope="col"
    >
      <button type="button" className="stocks-table__sort-btn" onClick={() => onSort(sortKey)}>
        {isActive && (dir === "desc" ? "▼ " : "▲ ")}
        {label}
      </button>
    </th>
  );
}

function StockTableRow({ stock }: { stock: CachedDisplayStock }) {
  const holders = formatHolderCount(stock.famousHolderCount);
  const marketCap = formatMarketCap(stock.marketCap);

  return (
    <tr className="stocks-list-table__row">
      <td className="stocks-list-table__ticker">
        <Link href={stockPath(stock.ticker)} className="stocks-list-table__link">
          {stock.ticker}
        </Link>
      </td>
      <td className="stocks-list-table__company">
        <Link href={stockPath(stock.ticker)} className="stocks-list-table__link-subtle">
          {stock.name}
        </Link>
      </td>
      <td className="stocks-list-table__num">{marketCap}</td>
      <td className="stocks-list-table__num">
        {holders === "—" ? <span className="stocks-table__na">—</span> : holders}
      </td>
    </tr>
  );
}

function StockCard({ stock }: { stock: CachedDisplayStock }) {
  const holders = formatHolderCount(stock.famousHolderCount);
  const cap = formatMarketCap(stock.marketCap);

  return (
    <Link href={stockPath(stock.ticker)} className="stocks-list-card">
      <div className="stocks-list-card__identity">
        <div className="stocks-list-card__ticker-row">
          <span className="stocks-list-card__ticker">{stock.ticker}</span>
        </div>
        <span className="stocks-list-card__name">{stock.name}</span>
      </div>
      <dl className="stocks-list-card__stats">
        <div className="stocks-list-card__stat">
          <dt>Market Cap</dt>
          <dd>{cap}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt># Tracked Investors</dt>
          <dd>{holders}</dd>
        </div>
      </dl>
    </Link>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EnrichedStock } from "@/lib/stocks-data";
import { Sparkline } from "@/components/stocks/Sparkline";
import { StockLogo } from "@/components/stocks/StockLogo";

type SortKey = "marketCap" | "peRatio" | "above52WeekLow" | "signalScore";

interface StocksTableProps {
  stocks: EnrichedStock[];
}

function sortValue(stock: EnrichedStock, key: SortKey): number {
  const v = stock[key];
  return v == null ? -Infinity : v;
}

export function StocksTable({ stocks }: StocksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const list = [...stocks];
    list.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return list;
  }, [stocks, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <section className="stocks-page">
      <header className="stocks-page__header">
        <h1 className="stocks-page__count">{stocks.length} stocks</h1>
        <p className="stocks-page__sub">Gold and Silver mining and Royalty Stocks</p>
        <p className="stocks-page__sub">Updated daily</p>
      </header>

      <div className="stocks-page__table-wrap">
        <table className="stocks-table">
          <thead>
            <tr>
              <th className="stocks-table__th stocks-table__th--logo" scope="col" />
              <th className="stocks-table__th stocks-table__th--name" scope="col">
                Name
              </th>
              <SortHeader label="Market Cap" sortKey="marketCap" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="P/E Ratio" sortKey="peRatio" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="stocks-table__th stocks-table__th--spark" scope="col">
                1Y Price History
              </th>
              <SortHeader
                label="% Above 52 Week Low"
                sortKey="above52WeekLow"
                active={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
              <th
                className={`stocks-table__th stocks-table__th--signal ${sortKey === "signalScore" ? "stocks-table__th--signal-active" : ""}`}
                scope="col"
              >
                <button type="button" className="stocks-table__sort-btn" onClick={() => toggleSort("signalScore")}>
                  {sortKey === "signalScore" && (sortDir === "desc" ? "▼ " : "▲ ")}
                  SignalScore
                  <br />
                  Rating
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock, index) => (
              <StockRow key={stock.ticker} stock={stock} isLast={index === sorted.length - 1} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} />
              <td className="stocks-table__signal-foot" />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="stocks-page__back">
        <Link href="/" className="btn btn--secondary">
          ← Back to home
        </Link>
      </p>
    </section>
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
    <th className={`stocks-table__th stocks-table__th--sort ${isActive ? "stocks-table__th--active" : ""}`} scope="col">
      <button type="button" className="stocks-table__sort-btn" onClick={() => onSort(sortKey)}>
        {isActive && (dir === "desc" ? "▼ " : "▲ ")}
        {label}
      </button>
    </th>
  );
}

function StockRow({ stock, isLast }: { stock: EnrichedStock; isLast: boolean }) {
  const positive = stock.above52WeekLow >= 0;

  return (
    <tr className="stocks-table__row">
      <td className="stocks-table__td stocks-table__td--logo">
        <StockLogo ticker={stock.ticker} logoUrl={stock.logoUrl} size={48} />
      </td>
      <td className="stocks-table__td stocks-table__td--name">
        <Link href={`/stocks/${stock.ticker}`} className="stocks-table__name-link">
          <span className="stocks-table__ticker">{stock.ticker}</span>
          <span className="stocks-table__company">{stock.name}</span>
        </Link>
      </td>
      <td className="stocks-table__td stocks-table__td--num">{stock.marketCap.toFixed(1)}B</td>
      <td className="stocks-table__td stocks-table__td--num">
        {stock.peRatio != null ? stock.peRatio : <span className="stocks-table__na">N/A</span>}
      </td>
      <td className="stocks-table__td stocks-table__td--spark">
        <Sparkline data={stock.priceHistory} />
      </td>
      <td className={`stocks-table__td stocks-table__td--num ${positive ? "stocks-table__change--up" : "stocks-table__change--down"}`}>
        {positive ? "▲" : "▼"} {Math.abs(stock.above52WeekLow).toFixed(2)}%
      </td>
      <td className={`stocks-table__td stocks-table__td--signal ${isLast ? "stocks-table__td--signal-last" : ""}`}>
        {stock.signalScore}
      </td>
    </tr>
  );
}

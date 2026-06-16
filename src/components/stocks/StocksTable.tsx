"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/stocks/StockLogo";
import { TopMoversPanel } from "@/components/stocks/TopMoversPanel";
import { stockPath } from "@/lib/paths";
import type { CachedDisplayStock } from "@/lib/stock-cache";
import { formatReturnPct } from "@/components/stocks/MiniReturnSparkline";

type SortKey = "ticker" | "name" | "marketCap" | "price" | "dailyChangePct";

type ListView = "universe" | "movers";

interface StocksTableProps {
  stocks: CachedDisplayStock[];
}

const LIST_VIEWS: Array<{ key: ListView; label: string }> = [
  { key: "universe", label: "All stocks" },
  { key: "movers", label: "Top movers" },
];

const MOBILE_SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Company" },
  { key: "marketCap", label: "Mkt Cap" },
  { key: "price", label: "Price" },
  { key: "dailyChangePct", label: "Day %" },
  { key: "ticker", label: "Ticker A-Z" },
];

function formatMarketCap(valueUsd: number | null): string {
  if (valueUsd == null || !Number.isFinite(valueUsd) || valueUsd <= 0) return "—";
  if (valueUsd >= 1_000_000_000_000) return `$${(valueUsd / 1_000_000_000_000).toFixed(2)}T`;
  if (valueUsd >= 1_000_000_000) return `$${(valueUsd / 1_000_000_000).toFixed(1)}B`;
  if (valueUsd >= 1_000_000) return `$${Math.round(valueUsd / 1_000_000)}M`;
  return `$${Math.round(valueUsd).toLocaleString()}`;
}

function formatPrice(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1000) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(3)}`;
}

function formatDailyChange(pct: number | null): { text: string; tone: "up" | "down" | "flat" | "na" } {
  if (pct == null || !Number.isFinite(pct)) return { text: "—", tone: "na" };
  const sign = pct > 0 ? "+" : "";
  const text = `${sign}${pct.toFixed(2)}%`;
  if (pct > 0) return { text, tone: "up" };
  if (pct < 0) return { text, tone: "down" };
  return { text, tone: "flat" };
}

function sortValue(stock: CachedDisplayStock, key: SortKey): number | string {
  if (key === "ticker") return stock.ticker;
  if (key === "name") return stock.name;
  if (key === "price") return stock.price ?? -1;
  if (key === "dailyChangePct") return stock.dailyChangePct ?? -9999;
  return stock.marketCap ?? -1;
}

export function StocksTable({ stocks }: StocksTableProps) {
  const [listView, setListView] = useState<ListView>("universe");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [stocks, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
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
  }, [filtered, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "ticker" || key === "name" ? "asc" : "desc");
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
          <p className="hero-tagline">Facts from public filings and market data</p>
          <p className="stocks-list-hero__sub">
            {stocks.length} tracked names — market cap, price, and daily change from cached reference data.
            No scores or predictions.
          </p>
        </div>
      </section>

      <div className="stocks-list-main">
        <div className="stocks-list-toolbar" role="navigation" aria-label="Stocks list views">
          <div className="stocks-list-toolbar__group">
            <span className="stocks-list-toolbar__label">View</span>
            <div className="stocks-list-sort">
              {LIST_VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={`stocks-list-sort__btn ${listView === v.key ? "stocks-list-sort__btn--active" : ""}`}
                  onClick={() => setListView(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="stocks-list-toolbar__group stocks-list-toolbar__group--search">
            <label className="stocks-list-toolbar__label" htmlFor="stocks-search">
              Search
            </label>
            <input
              id="stocks-search"
              type="search"
              className="stocks-list-search"
              placeholder="Ticker or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <p className="stocks-list-toolbar__count tabular-nums">
            {sorted.length} of {stocks.length}
          </p>
        </div>

        {listView === "movers" ? (
          <TopMoversPanel stocks={filtered} />
        ) : sorted.length === 0 ? (
          <div className="stocks-list-empty" role="status">
            <p className="stocks-list-empty__title">
              {search.trim() ? "No matches for that search" : "No tracked stocks yet"}
            </p>
            <p className="stocks-list-empty__body">
              {search.trim()
                ? "Try a ticker symbol or part of the company name."
                : "Stock rows populate after the daily cache refresh from our tracked universe."}
            </p>
          </div>
        ) : (
          <>
            <div className="stocks-list-mobile-sort" aria-label="Mobile stock sorting controls">
              <label className="stocks-list-mobile-sort__label" htmlFor="stocks-mobile-sort">
                Sort
              </label>
              <div className="stocks-list-mobile-sort__controls">
                <select
                  id="stocks-mobile-sort"
                  className="stocks-list-mobile-sort__select"
                  value={sortKey}
                  onChange={(event) => {
                    const nextKey = event.target.value as SortKey;
                    setSortKey(nextKey);
                    setSortDir(nextKey === "ticker" || nextKey === "name" ? "asc" : "desc");
                  }}
                >
                  {MOBILE_SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="stocks-list-mobile-sort__dir"
                  onClick={() => setSortDir((current) => (current === "desc" ? "asc" : "desc"))}
                  aria-label={`Sort direction: ${sortDir === "desc" ? "descending" : "ascending"}`}
                >
                  {sortDir === "desc" ? "Descending" : "Ascending"}
                </button>
              </div>
            </div>

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
                      className="stocks-list-table__th--ticker"
                    />
                    <SortHeader
                      label="Company"
                      sortKey="name"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--company"
                    />
                    <SortHeader
                      label="Mkt Cap"
                      sortKey="marketCap"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--cap"
                    />
                    <SortHeader
                      label="Price"
                      sortKey="price"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--price"
                    />
                    <SortHeader
                      label="Day %"
                      sortKey="dailyChangePct"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--chg"
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
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = active === sortKey;
  return (
    <th
      className={`stocks-table__th stocks-table__th--sort ${className} ${isActive ? "stocks-table__th--active" : ""}`.trim()}
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
  const chg = formatDailyChange(stock.dailyChangePct);

  return (
    <tr className="stocks-list-table__row">
      <td className="stocks-list-table__ticker tabular-nums">
        <Link href={stockPath(stock.ticker)} className="stocks-list-table__link">
          {stock.ticker}
        </Link>
      </td>
      <td className="stocks-list-table__company">
        <Link href={stockPath(stock.ticker)} className="stocks-list-table__link-subtle">
          <span className="stocks-list-company-cell">
            <StockLogo
              ticker={stock.ticker}
              logoUrl={stock.logoUrl}
              subCategory={stock.subCategory}
              size={34}
            />
            <span>{stock.name}</span>
          </span>
        </Link>
      </td>
      <td className="stocks-list-table__num stocks-list-table__num--cap tabular-nums">
        {formatMarketCap(stock.marketCap)}
      </td>
      <td className="stocks-list-table__num stocks-list-table__num--price tabular-nums">
        {formatPrice(stock.price)}
      </td>
      <td className="stocks-list-table__num stocks-list-table__num--chg tabular-nums">
        <span className={`stocks-return-cell stocks-return-cell--${chg.tone}`}>{chg.text}</span>
      </td>
    </tr>
  );
}

function StockCard({ stock }: { stock: CachedDisplayStock }) {
  const chg = formatDailyChange(stock.dailyChangePct);
  const ret3m = formatReturnPct(stock.return3mPct);

  return (
    <Link href={stockPath(stock.ticker)} className="stocks-list-card">
      <div className="stocks-list-card__head">
        <StockLogo
          ticker={stock.ticker}
          logoUrl={stock.logoUrl}
          subCategory={stock.subCategory}
          size={32}
        />
        <div className="stocks-list-card__identity">
          <div className="stocks-list-card__ticker-row">
            <span className="stocks-list-card__ticker">{stock.ticker}</span>
            <span className={`stocks-list-card__chg stocks-return-cell--${chg.tone} tabular-nums`}>
              {chg.text}
            </span>
          </div>
          <span className="stocks-list-card__name">{stock.name}</span>
        </div>
        <div className="stocks-list-card__price-block tabular-nums">
          <span className="stocks-list-card__price">{formatPrice(stock.price)}</span>
          <span className="stocks-list-card__cap">{formatMarketCap(stock.marketCap)}</span>
        </div>
      </div>
      {ret3m.text !== "—" ? (
        <p className="stocks-list-card__footnote tabular-nums">
          3M: <span className={`stocks-return-cell--${ret3m.tone}`}>{ret3m.text}</span>
        </p>
      ) : null}
    </Link>
  );
}

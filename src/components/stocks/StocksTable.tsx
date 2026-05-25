"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CachedDisplayStock } from "@/lib/stock-cache";
import { Sparkline } from "@/components/stocks/Sparkline";
import { StockLogo } from "@/components/stocks/StockLogo";

type SortKey = "signalScore" | "marketCap" | "above52WeekLow" | "alphabetical";

type CategoryFilter =
  | "all"
  | "major_producer"
  | "mid_tier_producer"
  | "junior_producer"
  | "developer"
  | "royalty"
  | "etf";

type MetalFilter = "all" | "gold" | "silver" | "diversified";

type PageSize = 50 | 100 | "all";

interface StocksTableProps {
  stocks: CachedDisplayStock[];
}

function sortValue(stock: CachedDisplayStock, key: SortKey): number | string {
  if (key === "alphabetical") return stock.ticker;
  if (key === "signalScore") return stock.signalScore ?? -Infinity;
  if (key === "marketCap") return stock.marketCap;
  return stock.above52WeekLow;
}

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "major_producer", label: "Major Producers" },
  { value: "mid_tier_producer", label: "Mid-Tier" },
  { value: "junior_producer", label: "Juniors" },
  { value: "developer", label: "Developers" },
  { value: "royalty", label: "Royalty" },
  { value: "etf", label: "ETFs" },
];

const METAL_OPTIONS: { value: MetalFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "diversified", label: "Diversified" },
];

export function StocksTable({ stocks }: StocksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("signalScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [metal, setMetal] = useState<MetalFilter>("all");
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (metal !== "all" && s.subCategory !== metal) return false;
      return true;
    });
  }, [stocks, category, metal]);

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

  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));

  const paged = useMemo(() => {
    if (pageSize === "all") return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir(key === "alphabetical" ? "asc" : "desc");
    }
  };

  const trackingCount = stocks.length;

  return (
    <section className="stocks-page">
      <header className="stocks-page__header">
        <h1 className="stocks-page__count">
          Tracking {trackingCount} gold and silver stocks
        </h1>
        <p className="stocks-page__sub">Gold and Silver mining and Royalty Stocks</p>
        <p className="stocks-page__sub">Updated daily</p>
      </header>

      <div className="stocks-page__filters">
        <label className="stocks-page__filter">
          <span className="stocks-page__filter-label">Category</span>
          <select
            className="stocks-page__select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as CategoryFilter);
              setPage(1);
            }}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="stocks-page__filter">
          <span className="stocks-page__filter-label">Metal</span>
          <select
            className="stocks-page__select"
            value={metal}
            onChange={(e) => {
              setMetal(e.target.value as MetalFilter);
              setPage(1);
            }}
          >
            {METAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="stocks-page__filter">
          <span className="stocks-page__filter-label">Sort by</span>
          <select
            className="stocks-page__select"
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              setPage(1);
            }}
          >
            <option value="signalScore">SignalScore (high-low)</option>
            <option value="marketCap">Market Cap (high-low)</option>
            <option value="above52WeekLow">Daily Change %</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </label>
        <label className="stocks-page__filter">
          <span className="stocks-page__filter-label">Show</span>
          <select
            className="stocks-page__select"
            value={String(pageSize)}
            onChange={(e) => {
              const v = e.target.value;
              setPageSize(v === "all" ? "all" : (Number(v) as 50 | 100));
              setPage(1);
            }}
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
        </label>
        {filtered.length !== trackingCount ? (
          <p className="stocks-page__filter-count">
            Showing {filtered.length} of {trackingCount}
          </p>
        ) : null}
      </div>

      <div className="stocks-page__table-wrap">
        <table className="stocks-table">
          <thead>
            <tr>
              <th className="stocks-table__th stocks-table__th--logo" scope="col" />
              <th className="stocks-table__th stocks-table__th--name" scope="col">
                <button type="button" className="stocks-table__sort-btn" onClick={() => toggleSort("alphabetical")}>
                  Name
                </button>
              </th>
              <SortHeader label="Market Cap" sortKey="marketCap" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="P/E Ratio" sortKey="marketCap" active={sortKey} dir={sortDir} onSort={() => {}} disabled />
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
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="stocks-table__td stocks-table__empty">
                  No stocks in cache yet. Run the daily refresh or seed the universe.
                </td>
              </tr>
            ) : (
              paged.map((stock, index) => (
                <StockRow key={stock.ticker} stock={stock} isLast={index === paged.length - 1} />
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} />
              <td className="stocks-table__signal-foot" />
            </tr>
          </tfoot>
        </table>
      </div>

      {pageSize !== "all" && totalPages > 1 ? (
        <nav className="stocks-page__pagination" aria-label="Stocks pagination">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="stocks-page__pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </nav>
      ) : null}

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
  disabled,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  disabled?: boolean;
}) {
  const isActive = active === sortKey;
  return (
    <th className={`stocks-table__th stocks-table__th--sort ${isActive ? "stocks-table__th--active" : ""}`} scope="col">
      <button
        type="button"
        className="stocks-table__sort-btn"
        onClick={() => !disabled && onSort(sortKey)}
        disabled={disabled}
      >
        {isActive && (dir === "desc" ? "▼ " : "▲ ")}
        {label}
      </button>
    </th>
  );
}

function StockRow({ stock, isLast }: { stock: CachedDisplayStock; isLast: boolean }) {
  const positive = stock.above52WeekLow >= 0;
  const showScore = stock.signalScore != null;
  const partial = stock.dataStatus === "partial";

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
        {showScore ? (
          <>
            {stock.signalScore}
            {partial ? <span className="stocks-table__partial" title="Partial data coverage"> *</span> : null}
          </>
        ) : (
          <span className="stocks-table__na">N/A</span>
        )}
      </td>
    </tr>
  );
}

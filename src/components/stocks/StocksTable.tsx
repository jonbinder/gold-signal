"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CachedDisplayStock } from "@/lib/stock-cache";
import { formatInsiderNetLabel } from "@/lib/stock-facts-format";
import {
  MARKET_CAP_SIZE_OPTIONS,
  marketCapSize,
  type MarketCapSize,
} from "@/lib/stock-category-labels";
import { StockLogo } from "@/components/stocks/StockLogo";

type SortKey = "alphabetical" | "holderCount" | "insiderNet" | "marketCap";

type CategoryFilter =
  | "all"
  | "major_producer"
  | "mid_tier_producer"
  | "junior_producer"
  | "developer"
  | "royalty"
  | "etf";

type MetalFilter = "all" | "gold" | "silver" | "diversified";

type PageSize = 50;

interface StocksTableProps {
  stocks: CachedDisplayStock[];
}

function sortValue(stock: CachedDisplayStock, key: SortKey): number | string {
  if (key === "alphabetical") return stock.ticker;
  if (key === "holderCount") return stock.famousHolderCount;
  if (key === "insiderNet") return stock.insiderNet90dUsd ?? -Infinity;
  return stock.marketCap;
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
  { value: "all", label: "All metals" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "diversified", label: "Diversified" },
];

export function StocksTable({ stocks }: StocksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("holderCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [metal, setMetal] = useState<MetalFilter>("all");
  const [capSize, setCapSize] = useState<MarketCapSize>("all");
  const pageSize = 50;
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (metal !== "all" && s.subCategory !== metal) return false;
      if (capSize !== "all" && marketCapSize(s.marketCap) !== capSize) return false;
      return true;
    });
  }, [stocks, category, metal, capSize]);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
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

  return (
    <section className="stocks-page">
      <header className="stocks-page__header">
        <h1 className="stocks-page__count">Tracking {stocks.length} gold and silver stocks</h1>
        <p className="stocks-page__sub">Who holds them and what insiders are doing — updated daily</p>
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
          <span className="stocks-page__filter-label">Market cap</span>
          <select
            className="stocks-page__select"
            value={capSize}
            onChange={(e) => {
              setCapSize(e.target.value as MarketCapSize);
              setPage(1);
            }}
          >
            {MARKET_CAP_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {filtered.length !== stocks.length ? (
          <p className="stocks-page__filter-count">
            Showing {filtered.length} of {stocks.length}
          </p>
        ) : null}
      </div>

      <div className="stocks-page__table-wrap">
        <table className="stocks-table stocks-table--facts">
          <thead>
            <tr>
              <th className="stocks-table__th stocks-table__th--logo" scope="col" />
              <SortHeader label="Ticker / Company" sortKey="alphabetical" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Tracked investors" sortKey="holderCount" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Insider (90d)" sortKey="insiderNet" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Market cap" sortKey="marketCap" active={sortKey} dir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="stocks-table__td stocks-table__empty">
                  No stocks match your filters.
                </td>
              </tr>
            ) : (
              paged.map((stock) => <StockRow key={stock.ticker} stock={stock} />)
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
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

function StockRow({ stock }: { stock: CachedDisplayStock }) {
  const insider = formatInsiderNetLabel(stock.insiderNet90dUsd);

  return (
    <tr className="stocks-table__row">
      <td className="stocks-table__td stocks-table__td--logo">
        <StockLogo ticker={stock.ticker} logoUrl={stock.logoUrl} size={40} />
      </td>
      <td className="stocks-table__td stocks-table__td--name">
        <Link href={`/stocks/${stock.ticker}`} className="stocks-table__name-link">
          <span className="stocks-table__ticker">{stock.ticker}</span>
          <span className="stocks-table__company">{stock.name}</span>
        </Link>
      </td>
      <td className="stocks-table__td stocks-table__td--num mono">
        {stock.famousHolderCount > 0 ? stock.famousHolderCount : "—"}
      </td>
      <td
        className={`stocks-table__td stocks-table__td--num text-sm ${
          insider.tone === "buy"
            ? "text-emerald-700"
            : insider.tone === "sell"
              ? "text-red-700"
              : "text-slate-600"
        }`}
      >
        {insider.text}
      </td>
      <td className="stocks-table__td stocks-table__td--num">
        {stock.marketCap >= 0.1 ? `${stock.marketCap.toFixed(1)}B` : "—"}
      </td>
    </tr>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CachedDisplayStock } from "@/lib/stock-cache";
import { formatInsiderNetLabel, formatHolderCount } from "@/lib/stock-facts-format";
import {
  MARKET_CAP_SIZE_OPTIONS,
  marketCapSize,
  type MarketCapSize,
} from "@/lib/stock-category-labels";
import { StockLogo } from "@/components/stocks/StockLogo";

type SortKey = "alphabetical" | "insiderNet" | "holderCount" | "marketCap";

type MetalFilter = "all" | "gold" | "silver";

interface StocksTableProps {
  stocks: CachedDisplayStock[];
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "alphabetical", label: "Ticker A–Z" },
  { key: "insiderNet", label: "Insider activity" },
  { key: "holderCount", label: "# holders" },
  { key: "marketCap", label: "Market cap" },
];

const METAL_OPTIONS: { value: MetalFilter; label: string }[] = [
  { value: "all", label: "All metals" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
];

function sortValue(stock: CachedDisplayStock, key: SortKey): number | string {
  if (key === "alphabetical") return stock.ticker;
  if (key === "insiderNet") return stock.insiderNet90dUsd ?? Number.NEGATIVE_INFINITY;
  if (key === "holderCount") return stock.famousHolderCount ?? -1;
  return stock.marketCap;
}

function metalLabel(subCategory: string): string {
  if (subCategory === "gold") return "Gold";
  if (subCategory === "silver") return "Silver";
  return "Diversified";
}

function metalClass(subCategory: string): string {
  if (subCategory === "gold") return "stocks-list-metal--gold";
  if (subCategory === "silver") return "stocks-list-metal--silver";
  return "stocks-list-metal--diversified";
}

export function StocksTable({ stocks }: StocksTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("alphabetical");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [metal, setMetal] = useState<MetalFilter>("all");
  const [capSize, setCapSize] = useState<MarketCapSize>("all");
  const pageSize = 50;
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (metal !== "all" && s.subCategory !== metal) return false;
      if (capSize !== "all" && marketCapSize(s.marketCap) !== capSize) return false;
      return true;
    });
  }, [stocks, metal, capSize]);

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

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "alphabetical" ? "asc" : "desc");
    }
    setPage(1);
  };

  return (
    <>
      <section className="stocks-list-hero" aria-labelledby="stocks-list-heading">
        <div className="stocks-list-hero__inner">
          <p className="stocks-list-hero__eyebrow mono">Universe</p>
          <h1 id="stocks-list-heading" className="stocks-list-hero__title">
            Gold &amp; silver stocks
          </h1>
          <p className="stocks-list-hero__sub">
            {stocks.length} tracked names — SEC Form 4 insider activity, institutional holders from
            13F filings, and market cap. Facts only; updated from cached filings data.
          </p>
        </div>
      </section>

      <div className="stocks-list-main">
        <div className="stocks-list-toolbar" role="group" aria-label="Filter stocks">
          <label className="stocks-list-toolbar__group">
            <span className="stocks-list-toolbar__label">Metal</span>
            <select
              className="stocks-list-toolbar__select"
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
          <label className="stocks-list-toolbar__group">
            <span className="stocks-list-toolbar__label">Market cap</span>
            <select
              className="stocks-list-toolbar__select"
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
            <p className="stocks-list-toolbar__count">
              Showing {filtered.length} of {stocks.length}
            </p>
          ) : null}
        </div>

        <div className="stocks-list-sort" role="group" aria-label="Sort stocks">
          {SORT_OPTIONS.map((opt) => {
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

        {paged.length === 0 ? (
          <p className="stocks-list-empty">No stocks match your filters.</p>
        ) : (
          <>
            <div className="stocks-list-table-wrap">
              <table className="stocks-table stocks-table--facts stocks-list-table">
                <thead>
                  <tr>
                    <th className="stocks-table__th stocks-table__th--logo" scope="col" />
                    <SortHeader
                      label="Ticker / Company"
                      sortKey="alphabetical"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <th className="stocks-table__th stocks-table__th--metal" scope="col">
                      Metal
                    </th>
                    <SortHeader
                      label="Insider (90d)"
                      sortKey="insiderNet"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <SortHeader
                      label="Tracked funds"
                      sortKey="holderCount"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                    <SortHeader
                      label="Market cap"
                      sortKey="marketCap"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((stock) => (
                    <StockTableRow key={stock.ticker} stock={stock} />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="stocks-list-cards" aria-label="Stocks list">
              {paged.map((stock) => (
                <li key={stock.ticker}>
                  <StockCard stock={stock} />
                </li>
              ))}
            </ul>
          </>
        )}

        {totalPages > 1 ? (
          <nav className="stocks-list-pagination" aria-label="Stocks pagination">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="stocks-list-pagination__info">
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

        <p className="stocks-list-back">
          <Link href="/" className="btn btn--secondary">
            ← Back to home
          </Link>
        </p>
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
  const insider = formatInsiderNetLabel(stock.insiderNet90dUsd);
  const holders = formatHolderCount(stock.famousHolderCount);

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
      <td className="stocks-table__td stocks-table__td--metal">
        <span className={`stocks-list-metal ${metalClass(stock.subCategory)}`}>
          {metalLabel(stock.subCategory)}
        </span>
      </td>
      <td
        className={`stocks-table__td stocks-table__td--num stocks-list-insider--${insider.tone}`}
      >
        {insider.text}
      </td>
      <td className="stocks-table__td stocks-table__td--num">
        {holders === "—" ? <span className="stocks-table__na">—</span> : holders}
      </td>
      <td className="stocks-table__td stocks-table__td--num">
        {stock.marketCap >= 0.1 ? `$${stock.marketCap.toFixed(1)}B` : <span className="stocks-table__na">—</span>}
      </td>
    </tr>
  );
}

function StockCard({ stock }: { stock: CachedDisplayStock }) {
  const insider = formatInsiderNetLabel(stock.insiderNet90dUsd);
  const holders = formatHolderCount(stock.famousHolderCount);
  const cap =
    stock.marketCap >= 0.1 ? `$${stock.marketCap.toFixed(1)}B` : "—";

  return (
    <Link href={`/stocks/${stock.ticker}`} className="stocks-list-card">
      <div className="stocks-list-card__head">
        <StockLogo ticker={stock.ticker} logoUrl={stock.logoUrl} size={44} />
        <div className="stocks-list-card__identity">
          <div className="stocks-list-card__ticker-row">
            <span className="stocks-list-card__ticker">{stock.ticker}</span>
            <span className={`stocks-list-metal ${metalClass(stock.subCategory)}`}>
              {metalLabel(stock.subCategory)}
            </span>
          </div>
          <span className="stocks-list-card__name">{stock.name}</span>
        </div>
      </div>
      <dl className="stocks-list-card__stats">
        <div className="stocks-list-card__stat stocks-list-card__stat--wide">
          <dt>Insider (90d)</dt>
          <dd className={`stocks-list-insider--${insider.tone}`}>{insider.text}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt>Tracked funds</dt>
          <dd>{holders}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt>Market cap</dt>
          <dd>{cap}</dd>
        </div>
      </dl>
    </Link>
  );
}

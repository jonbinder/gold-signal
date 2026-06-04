"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/stocks/StockLogo";
import { TopMoversPanel } from "@/components/stocks/TopMoversPanel";
import { stockPath } from "@/lib/paths";
import type { CachedDisplayStock } from "@/lib/stock-cache";
import { formatHolderCount, formatPctAbove52WeekLow } from "@/lib/stock-facts-format";

type SortKey =
  | "ticker"
  | "name"
  | "holderCount"
  | "marketCap"
  | "pctAbove52WeekLow"
  | "peRatio"
  | "forwardPeRatio";

type ListView = "universe" | "movers" | "value";

interface StocksTableProps {
  stocks: CachedDisplayStock[];
}

const LIST_VIEWS: Array<{ key: ListView; label: string }> = [
  { key: "universe", label: "All stocks" },
  { key: "movers", label: "Top movers" },
  { key: "value", label: "Value screen" },
];

/** Lower = cheaper / nearer 52w low (for value preset sort). */
function valueScreenScore(stock: CachedDisplayStock): number {
  const fpe = stock.forwardPeRatio ?? stock.peRatio ?? 9999;
  const pct52 = stock.pctAbove52WeekLow ?? 9999;
  return fpe * 0.65 + pct52 * 0.35;
}

const MOBILE_SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Company" },
  { key: "marketCap", label: "Mkt Cap" },
  { key: "pctAbove52WeekLow", label: "% Off 52W Low" },
  { key: "peRatio", label: "PE" },
  { key: "forwardPeRatio", label: "Fwd PE" },
  { key: "holderCount", label: "Investors" },
  { key: "ticker", label: "Ticker A-Z" },
];

function formatMarketCap(valueUsd: number | null): string {
  if (valueUsd == null || !Number.isFinite(valueUsd) || valueUsd <= 0) return "—";
  if (valueUsd >= 1_000_000_000_000) return `$${(valueUsd / 1_000_000_000_000).toFixed(2)}T`;
  if (valueUsd >= 1_000_000_000) return `$${(valueUsd / 1_000_000_000).toFixed(1)}B`;
  if (valueUsd >= 1_000_000) return `$${Math.round(valueUsd / 1_000_000)}M`;
  return `$${Math.round(valueUsd).toLocaleString()}`;
}

function formatRatio(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  return `${Math.round(value)}`;
}

function sortValue(stock: CachedDisplayStock, key: SortKey): number | string {
  if (key === "ticker") return stock.ticker;
  if (key === "name") return stock.name;
  if (key === "holderCount") return stock.famousHolderCount ?? -1;
  if (key === "pctAbove52WeekLow") return stock.pctAbove52WeekLow ?? -1;
  if (key === "peRatio") return stock.peRatio ?? -1;
  if (key === "forwardPeRatio") return stock.forwardPeRatio ?? -1;
  return stock.marketCap ?? -1;
}

export function StocksTable({ stocks }: StocksTableProps) {
  const [listView, setListView] = useState<ListView>("universe");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const list = [...stocks];
    if (listView === "value") {
      list.sort((a, b) => valueScreenScore(a) - valueScreenScore(b));
      return list;
    }
    list.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      const metricKeys: SortKey[] = ["peRatio", "forwardPeRatio", "pctAbove52WeekLow"];
      const lowerIsBetter = metricKeys.includes(sortKey);
      if (lowerIsBetter) {
        const aMissing = (av as number) < 0;
        const bMissing = (bv as number) < 0;
        if (aMissing !== bMissing) return aMissing ? 1 : -1;
        return sortDir === "asc"
          ? (av as number) - (bv as number)
          : (bv as number) - (av as number);
      }
      return sortDir === "desc"
        ? (bv as number) - (av as number)
        : (av as number) - (bv as number);
    });
    return list;
  }, [stocks, sortKey, sortDir, listView]);

  const setSort = (key: SortKey) => {
    if (listView === "value") setListView("universe");
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      const lowFirst: SortKey[] = ["peRatio", "forwardPeRatio", "pctAbove52WeekLow"];
      setSortDir(key === "ticker" || key === "name" ? "asc" : lowFirst.includes(key) ? "asc" : "desc");
    }
  };

  const applyValuePreset = () => {
    setListView("value");
    setSortKey("forwardPeRatio");
    setSortDir("asc");
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
        <div className="stocks-list-toolbar" role="navigation" aria-label="Stocks list views">
          <div className="stocks-list-toolbar__group">
            <span className="stocks-list-toolbar__label">View</span>
            <div className="stocks-list-sort">
              {LIST_VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={`stocks-list-sort__btn ${listView === v.key ? "stocks-list-sort__btn--active" : ""}`}
                  onClick={() => {
                    setListView(v.key);
                    if (v.key === "value") applyValuePreset();
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {listView === "universe" ? (
            <button type="button" className="stocks-list-sort__btn" onClick={applyValuePreset}>
              Value preset
            </button>
          ) : null}
        </div>

        {listView === "movers" ? (
          <TopMoversPanel stocks={stocks} />
        ) : sorted.length === 0 ? (
          <p className="stocks-list-empty">No tracked stocks yet.</p>
        ) : (
          <>
            {listView === "value" ? (
              <p className="stocks-value-note">
                Sorted by lower forward PE (or trailing PE) and distance from 52-week low — cached
                reference data only, not a rating.
              </p>
            ) : null}
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
                <colgroup>
                  <col className="stocks-list-table__col--ticker" />
                  <col className="stocks-list-table__col--company" />
                  <col className="stocks-list-table__col--cap" />
                  <col className="stocks-list-table__col--pct52" />
                  <col className="stocks-list-table__col--pe" />
                  <col className="stocks-list-table__col--fpe" />
                  <col className="stocks-list-table__col--holders" />
                </colgroup>
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
                      label="% Off 52W Low"
                      sortKey="pctAbove52WeekLow"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--pct52"
                    />
                    <SortHeader
                      label="PE"
                      sortKey="peRatio"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--pe"
                    />
                    <SortHeader
                      label="Fwd PE"
                      sortKey="forwardPeRatio"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--fpe"
                    />
                    <SortHeader
                      label="Investors"
                      sortKey="holderCount"
                      active={sortKey}
                      dir={sortDir}
                      onSort={setSort}
                      className="stocks-list-table__th--holders"
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
      <td className="stocks-list-table__num stocks-list-table__num--cap">{marketCap}</td>
      <td className="stocks-list-table__num stocks-list-table__num--pct52">
        {formatPctAbove52WeekLow(stock.pctAbove52WeekLow)}
      </td>
      <td className="stocks-list-table__num stocks-list-table__num--pe">{formatRatio(stock.peRatio)}</td>
      <td className="stocks-list-table__num stocks-list-table__num--fpe">
        {formatRatio(stock.forwardPeRatio)}
      </td>
      <td className="stocks-list-table__num stocks-list-table__num--holders">
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
          </div>
          <span className="stocks-list-card__name">{stock.name}</span>
        </div>
      </div>
      <dl className="stocks-list-card__stats">
        <div className="stocks-list-card__stat">
          <dt>Market Cap</dt>
          <dd>{cap}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt>% Off 52W Low</dt>
          <dd>{formatPctAbove52WeekLow(stock.pctAbove52WeekLow)}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt>PE</dt>
          <dd>{formatRatio(stock.peRatio)}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt>Fwd PE</dt>
          <dd>{formatRatio(stock.forwardPeRatio)}</dd>
        </div>
        <div className="stocks-list-card__stat">
          <dt>Investors</dt>
          <dd>{holders}</dd>
        </div>
      </dl>
    </Link>
  );
}

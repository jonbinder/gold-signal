"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CuratedStock } from "@/types/stocks-curated";
import type { StockMarketSnapshot } from "@/lib/stocks";
import { cn } from "@/lib/utils";

type McapTier = "all" | "mega" | "large" | "mid" | "small" | "micro" | "unknown";
type SortKey = "name" | "mktcap" | "change";

function tierFor(m: number | null): Exclude<McapTier, "all"> {
  if (m == null) return "unknown";
  if (m >= 50_000_000_000) return "mega";
  if (m >= 10_000_000_000) return "large";
  if (m >= 2_000_000_000) return "mid";
  if (m >= 300_000_000) return "small";
  return "micro";
}

function fmtPrice(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function fmtPct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtVol(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(Math.round(n));
}

export function GoldSilverStocksExplorer({ initialStocks }: { initialStocks: CuratedStock[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [exchange, setExchange] = useState<string>("all");
  const [mcapTier, setMcapTier] = useState<McapTier>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [quotes, setQuotes] = useState<Record<string, StockMarketSnapshot | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const exchanges = useMemo(() => {
    const s = new Set(initialStocks.map((x) => x.exchange));
    return [...s].sort();
  }, [initialStocks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialStocks.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (exchange !== "all" && s.exchange !== exchange) return false;
      if (mcapTier !== "all" && tierFor(s.market_cap_usd) !== mcapTier) return false;
      if (!q) return true;
      return s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });
  }, [initialStocks, search, category, exchange, mcapTier]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortKey === "mktcap") {
        const av = a.market_cap_usd ?? -1;
        const bv = b.market_cap_usd ?? -1;
        return bv - av;
      }
      const qa = quotes[a.ticker]?.changePct;
      const qb = quotes[b.ticker]?.changePct;
      const av = qa == null || !Number.isFinite(qa) ? -Infinity : qa;
      const bv = qb == null || !Number.isFinite(qb) ? -Infinity : qb;
      return bv - av;
    });
    return rows;
  }, [filtered, sortKey, quotes]);

  const loadQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) {
      setQuotes({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks/market-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const json = (await res.json()) as { quotes: Record<string, StockMarketSnapshot | null> };
      setQuotes(json.quotes ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotes");
      setQuotes({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuotes(filtered.map((s) => s.ticker));
  }, [filtered, loadQuotes]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-sm border border-white/10 bg-navy-950/80 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-400/90">
            Search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ticker or company name…"
            className="h-11 w-full rounded-sm border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-gold-500/60"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-400/90">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-sm border border-white/15 bg-black/30 px-2 text-sm text-white outline-none focus:border-gold-500/60"
          >
            <option value="all">All categories</option>
            <option value="Gold Producer">Gold Producer</option>
            <option value="Silver Producer">Silver Producer</option>
            <option value="Junior Explorer">Junior Explorer</option>
            <option value="Royalty/Streaming">Royalty / Streaming</option>
            <option value="ETF">ETF</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-400/90">
            Exchange
          </label>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="h-11 w-full rounded-sm border border-white/15 bg-black/30 px-2 text-sm text-white outline-none focus:border-gold-500/60"
          >
            <option value="all">All exchanges</option>
            {exchanges.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-400/90">
            Market cap tier
          </label>
          <select
            value={mcapTier}
            onChange={(e) => setMcapTier(e.target.value as McapTier)}
            className="h-11 w-full rounded-sm border border-white/15 bg-black/30 px-2 text-sm text-white outline-none focus:border-gold-500/60"
          >
            <option value="all">All tiers</option>
            <option value="mega">Mega (&gt;$50B)</option>
            <option value="large">Large ($10–50B)</option>
            <option value="mid">Mid ($2–10B)</option>
            <option value="small">Small ($300M–2B)</option>
            <option value="micro">Micro (&lt;$300M)</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-400/90">
            Sort by
          </label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-11 w-full rounded-sm border border-white/15 bg-black/30 px-2 text-sm text-white outline-none focus:border-gold-500/60"
          >
            <option value="name">Name (A–Z)</option>
            <option value="mktcap">Market cap (high → low)</option>
            <option value="change">Price change % (high → low)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <div className="overflow-hidden rounded-sm border border-white/10 bg-navy-950/60 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="font-mono text-[11px] text-slate-400">
            Showing <span className="text-gold-400">{sorted.length}</span> of {initialStocks.length} symbols
            {loading ? " · refreshing quotes…" : ""}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 sm:px-5">Ticker</th>
                <th className="px-4 py-3 sm:px-5">Company</th>
                <th className="px-4 py-3 text-right sm:px-5">Price</th>
                <th className="px-4 py-3 text-right sm:px-5">% Chg</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell sm:px-5">Volume</th>
                <th className="px-4 py-3 sm:px-5">Category</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const q = quotes[s.ticker];
                const ch = q?.changePct ?? null;
                const chColor =
                  ch == null ? "text-slate-400" : ch > 0 ? "text-emerald-400" : ch < 0 ? "text-red-400" : "text-slate-300";
                return (
                  <tr key={s.id ?? s.ticker} className="border-b border-white/5 hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-mono font-bold tracking-wide text-gold-400 sm:px-5">{s.ticker}</td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-slate-100 sm:max-w-md sm:px-5">{s.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100 sm:px-5">{fmtPrice(q?.price ?? null)}</td>
                    <td className={cn("px-4 py-3 text-right font-mono sm:px-5", chColor)}>{fmtPct(ch)}</td>
                    <td className="hidden px-4 py-3 text-right font-mono text-slate-300 sm:table-cell sm:px-5">
                      {fmtVol(q?.volume ?? null)}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <span className="inline-block rounded-sm border border-white/10 bg-black/30 px-2 py-0.5 text-xs text-slate-200">
                        {s.category}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center font-mono text-[11px] uppercase tracking-wide text-slate-500">
        Prices updated twice daily · Data from Polygon.io
      </p>
    </div>
  );
}

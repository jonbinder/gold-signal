import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { buildPriceHistory } from "@/lib/stocks-data";

export type CachedDisplayStock = {
  ticker: string;
  name: string;
  category: string;
  subCategory: string;
  exchange: string | null;
  marketCap: number;
  peRatio: number | null;
  priceHistory: number[];
  above52WeekLow: number;
  dailyChangePct: number | null;
  signalScore: number | null;
  logoUrl: string;
  dataStatus: string;
  signalCoverage: number | null;
};

type CacheRow = {
  ticker: string;
  name: string;
  category: string;
  sub_category: string;
  exchange: string | null;
  logo_url: string | null;
  market_cap: number | null;
  pe_ratio: number | null;
  pct_above_52_week_low: number | null;
  daily_change_pct: number | null;
  signal_score: number | null;
  data_status: string | null;
  signal_coverage: number | null;
};

function mapRow(row: CacheRow): CachedDisplayStock {
  const marketCapB =
    row.market_cap != null && row.market_cap > 0
      ? row.market_cap / 1_000_000_000
      : 0.1;
  const daily = row.daily_change_pct ?? 0;
  const above52 =
    row.pct_above_52_week_low != null
      ? row.pct_above_52_week_low
      : daily;

  return {
    ticker: row.ticker,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category,
    exchange: row.exchange,
    marketCap: marketCapB,
    peRatio: row.pe_ratio,
    priceHistory: buildPriceHistory(row.ticker, daily),
    above52WeekLow: above52,
    dailyChangePct: row.daily_change_pct,
    signalScore:
      row.data_status === "error" || row.signal_score == null ? null : row.signal_score,
    logoUrl: row.logo_url ?? "",
    dataStatus: row.data_status ?? "pending",
    signalCoverage: row.signal_coverage,
  };
}

/**
 * Loads all stocks from stock_data_cache for the /stocks page (public RLS read).
 */
export const getCachedDisplayStocks = cache(async (): Promise<CachedDisplayStock[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    console.warn("[stock-cache] Supabase public env not configured");
    return [];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("stock_data_cache")
    .select(
      "ticker, name, category, sub_category, exchange, logo_url, market_cap, pe_ratio, pct_above_52_week_low, daily_change_pct, signal_score, data_status, signal_coverage",
    )
    .order("signal_score", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[stock-cache] Fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as CacheRow));
});

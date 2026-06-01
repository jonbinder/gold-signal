import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

export type CachedDisplayStock = {
  ticker: string;
  name: string;
  category: string;
  subCategory: string;
  exchange: string | null;
  marketCap: number;
  insiderNet90dUsd: number | null;
  famousHolderCount: number | null;
  logoUrl: string;
  dataStatus: string;
};

type CacheRow = {
  ticker: string;
  name: string;
  category: string;
  sub_category: string;
  exchange: string | null;
  logo_url: string | null;
  market_cap: number | null;
  insider_net_90d_usd: number | null;
  famous_holder_count: number | null;
  data_status: string | null;
};

function mapRow(row: CacheRow): CachedDisplayStock {
  const marketCapB =
    row.market_cap != null && row.market_cap > 0 ? row.market_cap / 1_000_000_000 : 0.1;

  return {
    ticker: row.ticker,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category,
    exchange: row.exchange,
    marketCap: marketCapB,
    insiderNet90dUsd: row.insider_net_90d_usd,
    famousHolderCount:
      row.famous_holder_count != null && row.famous_holder_count >= 0
        ? row.famous_holder_count
        : null,
    logoUrl: row.logo_url ?? "",
    dataStatus: row.data_status ?? "pending",
  };
}

function fallbackFromTrackedFile(): CachedDisplayStock[] {
  return loadTrackedStocksSync().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    category: s.category,
    subCategory: s.sub_category,
    exchange: s.exchange,
    marketCap: 0.1,
    insiderNet90dUsd: null,
    famousHolderCount: null,
    logoUrl: s.logo_url ?? "",
    dataStatus: "pending",
  }));
}

/**
 * Loads all stocks from stock_data_cache for the /stocks page (public RLS read).
 */
export const getCachedDisplayStocks = cache(async (): Promise<CachedDisplayStock[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    console.warn("[stock-cache] Supabase public env not configured — using tracked-stocks.json");
    return fallbackFromTrackedFile();
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("stock_data_cache")
    .select(
      "ticker, name, category, sub_category, exchange, logo_url, market_cap, insider_net_90d_usd, famous_holder_count, data_status",
    )
    .order("ticker", { ascending: true });

  if (error) {
    console.error("[stock-cache] Fetch failed:", error.message);
    return fallbackFromTrackedFile();
  }

  if (!data?.length) return fallbackFromTrackedFile();

  return data.map((row) => mapRow(row as CacheRow));
});

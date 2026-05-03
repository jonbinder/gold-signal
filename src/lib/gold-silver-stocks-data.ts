import { cache } from "react";
import { createClient } from "./supabase/server";
import type { CuratedStock } from "@/types/stocks-curated";
import { GOLD_SILVER_STOCK_SEED } from "@/lib/gold-silver-stocks-seed-data";

/** Normalize Postgres bigint / string values for JSON + client props. */
function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function fallbackStocks(): CuratedStock[] {
  return GOLD_SILVER_STOCK_SEED.map((r, i) => ({
    ...r,
    id: `static-${r.ticker}-${i}`,
  }));
}

/**
 * Curated list for `/gold-silver-stocks`. Lives in its own module (not `data.ts`)
 * so the page bundle does not pull `@/lib/stocks` / API route shared chunks.
 */
export const getGoldSilverStocksForPage = cache(async (): Promise<CuratedStock[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallbackStocks();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stocks")
      .select("id,ticker,name,category,exchange,market_cap_usd,is_active,created_at")
      .eq("is_active", true)
      .order("ticker");

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: String(row.id),
        ticker: String(row.ticker),
        name: String(row.name),
        category: row.category as CuratedStock["category"],
        exchange: String(row.exchange),
        market_cap_usd: toNumberOrNull(row.market_cap_usd),
        is_active: Boolean(row.is_active),
        created_at: typeof row.created_at === "string" ? row.created_at : undefined,
      }));
    }
  } catch {
    // Missing env at runtime, cookies unavailable, network, etc.
  }

  return fallbackStocks();
});

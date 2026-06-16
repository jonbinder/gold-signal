import { unstable_cache } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase";

export type CachedMetalsMarket = {
  goldPrice: number | null;
  goldChangePct: number | null;
  silverPrice: number | null;
  silverChangePct: number | null;
  goldSilverRatio: number | null;
  ratioChangePct: number | null;
  goldLabel: string;
  silverLabel: string;
  updatedAt: string | null;
};

type MetalsRow = {
  gold_price: number | null;
  gold_change_pct: number | null;
  silver_price: number | null;
  silver_change_pct: number | null;
  gold_silver_ratio: number | null;
  ratio_change_pct: number | null;
  gold_label: string | null;
  silver_label: string | null;
  updated_at: string | null;
};

function mapRow(row: MetalsRow | null): CachedMetalsMarket | null {
  if (!row) return null;
  return {
    goldPrice: finite(row.gold_price),
    goldChangePct: finite(row.gold_change_pct),
    silverPrice: finite(row.silver_price),
    silverChangePct: finite(row.silver_change_pct),
    goldSilverRatio: finite(row.gold_silver_ratio),
    ratioChangePct: finite(row.ratio_change_pct),
    goldLabel: row.gold_label?.trim() || "Gold (USD/oz)",
    silverLabel: row.silver_label?.trim() || "Silver (USD/oz)",
    updatedAt: row.updated_at,
  };
}

function finite(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

async function loadMetalsMarketFromSupabase(): Promise<CachedMetalsMarket | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("metals_market_cache").select("*").eq("id", 1).maybeSingle();

  if (error) {
    if (error.code === "42P01") return null;
    console.warn("[metals-market] read failed:", error.message);
    return null;
  }
  return mapRow(data as MetalsRow | null);
}

const loadMetalsMarketCached = unstable_cache(loadMetalsMarketFromSupabase, ["metals-market-cache-v2"], {
  revalidate: 3600,
  tags: ["metals-market"],
});

export async function getCachedMetalsMarket(): Promise<CachedMetalsMarket | null> {
  return loadMetalsMarketCached();
}

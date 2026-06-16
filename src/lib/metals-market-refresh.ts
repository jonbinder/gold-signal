import {
  goldSilverRatioChangePct,
  resolveGoldSpotQuote,
  resolveSilverSpotQuote,
} from "@/lib/metals-spot-quotes";
import { createSupabaseServiceClient } from "@/lib/supabase";

/**
 * Refresh metals_market_cache from physical gold/silver spot (background job only).
 * Uses COMEX futures / forex (GC=F, SI=F) — not GLD/SLV ETF share prices.
 */
export async function refreshMetalsMarketCache(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const [gold, silver] = await Promise.all([resolveGoldSpotQuote(), resolveSilverSpotQuote()]);

  if (!gold || !silver) {
    console.warn("[metals-market-refresh] spot unavailable; keeping last cache", {
      gold: Boolean(gold),
      silver: Boolean(silver),
    });
    return { ok: false, error: "Spot gold/silver price unavailable" };
  }

  const ratio = gold.price / silver.price;

  const { error } = await supabase.from("metals_market_cache").upsert(
    {
      id: 1,
      gold_price: Math.round(gold.price * 100) / 100,
      gold_change_pct: gold.changePct,
      silver_price: Math.round(silver.price * 1000) / 1000,
      silver_change_pct: silver.changePct,
      gold_silver_ratio: Math.round(ratio * 100) / 100,
      ratio_change_pct: goldSilverRatioChangePct(gold, silver),
      gold_label: "Gold (USD/oz)",
      silver_label: "Silver (USD/oz)",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error?.code === "42P01") {
    return { ok: false, error: "metals_market_cache table missing — run migration 023" };
  }
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

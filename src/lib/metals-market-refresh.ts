import { getStockPrice, getTickerDetails } from "@/lib/polygon";
import { createSupabaseServiceClient } from "@/lib/supabase";

const GOLD_ETF = "GLD";
const SILVER_ETF = "SLV";

function dailyChangePct(price: number, previousClose: number | null): number | null {
  if (previousClose == null || previousClose <= 0 || !Number.isFinite(price)) return null;
  return ((price - previousClose) / previousClose) * 100;
}

/**
 * Refresh metals_market_cache from GLD/SLV (Polygon in background job only).
 */
export async function refreshMetalsMarketCache(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const [goldPriceRes, silverPriceRes, goldDetails, silverDetails] = await Promise.all([
    getStockPrice(GOLD_ETF),
    getStockPrice(SILVER_ETF),
    getTickerDetails(GOLD_ETF),
    getTickerDetails(SILVER_ETF),
  ]);

  const goldPrice = goldPriceRes.ok ? goldPriceRes.data.close : null;
  const silverPrice = silverPriceRes.ok ? silverPriceRes.data.close : null;

  const goldPrev =
    goldDetails.ok && typeof goldDetails.data.raw === "object"
      ? (goldDetails.data.raw as { prev_close?: number }).prev_close ?? null
      : null;
  const silverPrev =
    silverDetails.ok && typeof silverDetails.data.raw === "object"
      ? (silverDetails.data.raw as { prev_close?: number }).prev_close ?? null
      : null;

  if (goldPrice == null || silverPrice == null || silverPrice <= 0) {
    return { ok: false, error: "GLD/SLV price unavailable" };
  }

  const goldChangePct = dailyChangePct(goldPrice, goldPrev);
  const silverChangePct = dailyChangePct(silverPrice, silverPrev);
  const ratio = goldPrice / silverPrice;

  let ratioChangePct: number | null = null;
  if (goldPrev != null && silverPrev != null && silverPrev > 0 && goldPrev > 0) {
    const prevRatio = goldPrev / silverPrev;
    if (prevRatio > 0) {
      ratioChangePct = ((ratio - prevRatio) / prevRatio) * 100;
    }
  }

  const { error } = await supabase.from("metals_market_cache").upsert(
    {
      id: 1,
      gold_price: goldPrice,
      gold_change_pct: goldChangePct,
      silver_price: silverPrice,
      silver_change_pct: silverChangePct,
      gold_silver_ratio: Math.round(ratio * 100) / 100,
      ratio_change_pct: ratioChangePct,
      gold_label: "Gold (GLD)",
      silver_label: "Silver (SLV)",
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

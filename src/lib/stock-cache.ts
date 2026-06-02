import { cache } from "react";
import { getTrackedFundHolderCount } from "@/lib/funds/holder-count";
import { getTickerDetails, normalizeTicker } from "@/lib/polygon";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

export type CachedDisplayStock = {
  ticker: string;
  name: string;
  category: string;
  subCategory: string;
  exchange: string | null;
  marketCap: number | null;
  insiderNet90dUsd: number | null;
  famousHolderCount: number | null;
  logoUrl: string;
  dataStatus: string;
};

function fallbackFromTrackedFile(): CachedDisplayStock[] {
  const deduped = new Map<string, ReturnType<typeof loadTrackedStocksSync>[number]>();
  for (const stock of loadTrackedStocksSync()) {
    const ticker = normalizeTicker(stock.ticker);
    if (!ticker || deduped.has(ticker)) continue;
    deduped.set(ticker, stock);
  }
  return [...deduped.entries()].map(([ticker, s]) => ({
    ticker,
    name: s.name,
    category: s.category,
    subCategory: s.sub_category,
    exchange: s.exchange,
    marketCap: null,
    insiderNet90dUsd: null,
    famousHolderCount: null,
    logoUrl: "",
    dataStatus: "pending",
  }));
}

async function enrichFromPolygon(seed: CachedDisplayStock): Promise<CachedDisplayStock> {
  const [details, holderCount] = await Promise.all([
    getTickerDetails(seed.ticker),
    getTrackedFundHolderCount(seed.ticker),
  ]);
  const branding =
    details.ok && details.data.raw && typeof details.data.raw === "object"
      ? ((details.data.raw as { branding?: { logo_url?: string | null } }).branding ?? null)
      : null;
  return {
    ...seed,
    name: details.ok ? details.data.name : seed.name,
    marketCap: details.ok && details.data.marketCap && details.data.marketCap > 0 ? details.data.marketCap : null,
    famousHolderCount: holderCount,
    logoUrl: branding?.logo_url?.trim() ?? "",
    dataStatus: details.ok ? "healthy" : "partial",
  };
}

/**
 * Loads tracked stocks for the /stocks page and enriches with Polygon reference details.
 * One row per unique ticker.
 */
export const getCachedDisplayStocks = cache(async (): Promise<CachedDisplayStock[]> => {
  const seed = fallbackFromTrackedFile();
  const enriched = await Promise.all(seed.map((stock) => enrichFromPolygon(stock)));
  return enriched.sort((a, b) => a.ticker.localeCompare(b.ticker));
});

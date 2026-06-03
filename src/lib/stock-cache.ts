import { cache } from "react";
import { getTrackedFundHolderCount } from "@/lib/funds/holder-count";
import {
  extractPolygonBranding,
  normalizeClientLogoUrl,
  pickPolygonBrandingImageUrl,
  stockLogoServePath,
} from "@/lib/stock-branding";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { formatDisplayCompanyName } from "@/lib/format-company-name";
import { getStockPrice, getTickerDetails, normalizeTicker } from "@/lib/polygon";
import { resolveStockPeRatios } from "@/lib/stock-pe-ratios";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

export type CachedDisplayStock = {
  ticker: string;
  name: string;
  category: string;
  subCategory: string;
  exchange: string | null;
  marketCap: number | null;
  peRatio: number | null;
  forwardPeRatio: number | null;
  insiderNet90dUsd: number | null;
  famousHolderCount: number | null;
  logoUrl: string;
  dataStatus: string;
};

type StocksListCache = {
  value: CachedDisplayStock[];
  expiresAt: number;
};

const DAILY_CACHE_MS = 24 * 60 * 60 * 1000;
let stocksListCache: StocksListCache | null = null;

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
    peRatio: null,
    forwardPeRatio: null,
    insiderNet90dUsd: null,
    famousHolderCount: null,
    logoUrl: "",
    dataStatus: "pending",
  }));
}

async function loadCachedPeRatios(tickers: string[]): Promise<
  Map<string, { peRatio: number | null; forwardPeRatio: number | null }>
> {
  const supabase = createSupabaseServiceClient();
  const map = new Map<string, { peRatio: number | null; forwardPeRatio: number | null }>();
  if (!supabase || tickers.length === 0) return map;

  const { data, error } = await supabase
    .from("stock_data_cache")
    .select("ticker, pe_ratio, forward_pe_ratio")
    .in("ticker", tickers);
  if (error) return map;

  for (const row of data ?? []) {
    const sym = normalizeTicker((row as { ticker: string }).ticker);
    const pe = (row as { pe_ratio: number | null }).pe_ratio;
    const fpe = (row as { forward_pe_ratio: number | null }).forward_pe_ratio;
    map.set(sym, {
      peRatio: typeof pe === "number" && pe > 0 ? pe : null,
      forwardPeRatio: typeof fpe === "number" && fpe > 0 ? fpe : null,
    });
  }
  return map;
}

async function peRatiosForSeed(seed: CachedDisplayStock) {
  if (seed.peRatio != null && seed.forwardPeRatio != null) {
    return { peRatio: seed.peRatio, forwardPeRatio: seed.forwardPeRatio };
  }
  const live = await resolveStockPeRatios(seed.ticker);
  return {
    peRatio: seed.peRatio ?? live.peRatio,
    forwardPeRatio: seed.forwardPeRatio ?? live.forwardPeRatio,
  };
}

async function enrichFromPolygon(seed: CachedDisplayStock): Promise<CachedDisplayStock> {
  const [details, holderCount, peRatios] = await Promise.all([
    getTickerDetails(seed.ticker),
    getTrackedFundHolderCount(seed.ticker),
    peRatiosForSeed(seed),
  ]);
  const { peRatio, forwardPeRatio } = peRatios;
  const branding = details.ok ? extractPolygonBranding(details.data.raw) : null;
  const polygonLogo = pickPolygonBrandingImageUrl(branding)
    ? stockLogoServePath(seed.ticker)
    : null;
  const cachedLogo = normalizeClientLogoUrl(seed.logoUrl, seed.ticker);
  const displayName = formatDisplayCompanyName(details.ok ? details.data.name : seed.name);

  return {
    ...seed,
    name: displayName,
    marketCap: details.ok && details.data.marketCap && details.data.marketCap > 0 ? details.data.marketCap : null,
    peRatio,
    forwardPeRatio,
    famousHolderCount: holderCount,
    logoUrl: polygonLogo ?? cachedLogo ?? "",
    dataStatus: details.ok ? "healthy" : "partial",
  };
}

async function loadCachedLogoUrls(tickers: string[]): Promise<Map<string, string>> {
  const supabase = createSupabaseServiceClient();
  if (!supabase || tickers.length === 0) return new Map();

  const { data } = await supabase.from("stock_data_cache").select("ticker, logo_url").in("ticker", tickers);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const sym = normalizeTicker((row as { ticker: string }).ticker);
    const url = normalizeClientLogoUrl((row as { logo_url: string | null }).logo_url, sym);
    if (url) map.set(sym, url);
  }
  return map;
}

export const getCachedDisplayStocks = cache(async (): Promise<CachedDisplayStock[]> => {
  if (stocksListCache && Date.now() < stocksListCache.expiresAt) {
    return stocksListCache.value;
  }
  const seed = fallbackFromTrackedFile();
  const tickers = seed.map((s) => s.ticker);
  const [logoMap, peMap] = await Promise.all([loadCachedLogoUrls(tickers), loadCachedPeRatios(tickers)]);
  const seedWithLogos = seed.map((stock) => {
    const cachedPe = peMap.get(stock.ticker);
    return {
      ...stock,
      logoUrl: logoMap.get(stock.ticker) ?? stock.logoUrl,
      peRatio: cachedPe?.peRatio ?? stock.peRatio,
      forwardPeRatio: cachedPe?.forwardPeRatio ?? stock.forwardPeRatio,
    };
  });
  const enriched = await Promise.all(seedWithLogos.map((stock) => enrichFromPolygon(stock)));
  const sorted = enriched.sort((a, b) => a.ticker.localeCompare(b.ticker));
  stocksListCache = { value: sorted, expiresAt: Date.now() + DAILY_CACHE_MS };
  return sorted;
});

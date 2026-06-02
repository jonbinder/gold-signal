import { cache } from "react";
import { getTrackedFundHolderCount } from "@/lib/funds/holder-count";
import { getFinancials, getStockPrice, getTickerDetails, normalizeTicker } from "@/lib/polygon";
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

function roundRatio(value: number | null): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? rounded : null;
}

function computePeRatios(input: {
  price: number | null;
  ttmEps: number | null;
  forwardEps: number | null;
}): { peRatio: number | null; forwardPeRatio: number | null } {
  const peRatio =
    input.price != null && input.price > 0 && input.ttmEps != null && input.ttmEps > 0
      ? roundRatio(input.price / input.ttmEps)
      : null;
  const forwardPeRatio =
    input.price != null && input.price > 0 && input.forwardEps != null && input.forwardEps > 0
      ? roundRatio(input.price / input.forwardEps)
      : null;
  return { peRatio, forwardPeRatio };
}

async function enrichFromPolygon(seed: CachedDisplayStock): Promise<CachedDisplayStock> {
  const [details, holderCount, financials, price] = await Promise.all([
    getTickerDetails(seed.ticker),
    getTrackedFundHolderCount(seed.ticker),
    getFinancials(seed.ticker),
    getStockPrice(seed.ticker),
  ]);
  const latestClose = price.ok ? price.data.close : null;
  const quarters = financials.ok ? financials.data.quarters : [];
  const ttmEps = (() => {
    const epsRows = quarters
      .map((q) => q.epsDiluted ?? q.epsBasic)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (epsRows.length >= 4) return epsRows.slice(0, 4).reduce((sum, v) => sum + v, 0);
    const shares = details.ok ? details.data.sharesOutstanding : null;
    const niRows = quarters
      .map((q) => q.netIncome)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (niRows.length >= 4 && shares && shares > 0) {
      return niRows.slice(0, 4).reduce((sum, v) => sum + v, 0) / shares;
    }
    return null;
  })();
  // Polygon plans rarely expose forward EPS directly. We use annualized latest quarter EPS
  // as a conservative forward proxy; if unavailable/non-positive, we render "—".
  const forwardEpsProxy = (() => {
    const latestQuarter = quarters[0];
    const latestEps = latestQuarter?.epsDiluted ?? latestQuarter?.epsBasic ?? null;
    if (latestEps != null && Number.isFinite(latestEps) && latestEps > 0) return latestEps * 4;
    return null;
  })();
  const { peRatio, forwardPeRatio } = computePeRatios({
    price: latestClose,
    ttmEps,
    forwardEps: forwardEpsProxy,
  });
  const branding =
    details.ok && details.data.raw && typeof details.data.raw === "object"
      ? ((details.data.raw as { branding?: { logo_url?: string | null } }).branding ?? null)
      : null;
  return {
    ...seed,
    name: details.ok ? details.data.name : seed.name,
    marketCap: details.ok && details.data.marketCap && details.data.marketCap > 0 ? details.data.marketCap : null,
    peRatio,
    forwardPeRatio,
    famousHolderCount: holderCount,
    logoUrl: branding?.logo_url?.trim() ?? "",
    dataStatus: details.ok ? "healthy" : "partial",
  };
}

export const getCachedDisplayStocks = cache(async (): Promise<CachedDisplayStock[]> => {
  if (stocksListCache && Date.now() < stocksListCache.expiresAt) {
    return stocksListCache.value;
  }
  const seed = fallbackFromTrackedFile();
  const enriched = await Promise.all(seed.map((stock) => enrichFromPolygon(stock)));
  const sorted = enriched.sort((a, b) => a.ticker.localeCompare(b.ticker));
  stocksListCache = { value: sorted, expiresAt: Date.now() + DAILY_CACHE_MS };
  return sorted;
});

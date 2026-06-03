import type { Stock } from "@/lib/goldsignal/data";
import { getStocks } from "@/lib/goldsignal/data";
import { GOLD_SILVER_STOCK_SEED } from "@/lib/gold-silver-stocks-seed-data";
import { normalizeClientLogoUrl } from "@/lib/stock-branding";

/** DORMANT enrichment for legacy investor-holdings UI — not used on public stock pages. */
export type EnrichedStock = {
  ticker: string;
  name: string;
  sector: string;
  marketCap: number;
  peRatio: number | null;
  priceHistory: number[];
  above52WeekLow: number;
  logoUrl: string;
};

const marketCapBillions = new Map(
  GOLD_SILVER_STOCK_SEED.map((s) => [s.ticker, (s.market_cap_usd ?? 0) / 1_000_000_000]),
);

/** Approximate trailing P/E when not in spreadsheet */
const PE_BY_TICKER: Record<string, number | null> = {
  ELE: 55,
  FNV: 42,
  WPM: 30,
  GOLD: 19,
  AEM: 16,
  KGC: 15,
  AG: null,
  PAAS: 22,
  RGLD: 38,
  GDX: 18,
  HL: null,
  MUX: null,
  NEM: 14,
};

function hashSeed(ticker: string): number {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
  return h;
}

/** 12 monthly points for sparkline — deterministic per ticker */
export function buildPriceHistory(ticker: string, monthlyChange: number): number[] {
  const seed = hashSeed(ticker);
  const trend = monthlyChange / 100;
  const base = 40 + (seed % 25);
  const points: number[] = [];
  for (let i = 0; i < 12; i++) {
    const wave = Math.sin((seed + i * 7) * 0.31) * 4;
    const drift = trend * base * (i / 11);
    points.push(Math.max(8, base + drift + wave + ((seed >> (i % 5)) & 3) - 1));
  }
  return points;
}

function pctAbove52WeekLow(history: number[]): number {
  const low = Math.min(...history);
  const last = history[history.length - 1];
  if (low <= 0) return 0;
  return ((last - low) / low) * 100;
}

export function enrichStock(raw: Stock): EnrichedStock {
  const history = buildPriceHistory(raw.ticker, raw.monthlyChange);
  const fromSeed = marketCapBillions.get(raw.ticker);
  const marketCap =
    fromSeed && fromSeed > 0 ? fromSeed : Math.max(0.1, ((hashSeed(raw.ticker) % 40) + 10) / 10);

  return {
    ticker: raw.ticker,
    name: raw.company,
    sector: raw.sector,
    marketCap,
    peRatio: PE_BY_TICKER[raw.ticker] ?? null,
    priceHistory: history,
    above52WeekLow: pctAbove52WeekLow(history),
    logoUrl: normalizeClientLogoUrl(null, raw.ticker) ?? "",
  };
}

export function getEnrichedStocks(): EnrichedStock[] {
  return getStocks().map(enrichStock);
}

const stocksByTicker = () => {
  const map = new Map<string, EnrichedStock>();
  for (const s of getEnrichedStocks()) map.set(s.ticker, s);
  return map;
};

/** Lookup enrichment for a holding ticker (rankings sheet or stocks.json). */
export function getEnrichmentForTicker(rawTicker: string): Partial<EnrichedStock> | null {
  const ticker = rawTicker.trim().toUpperCase();
  if (!ticker) return null;

  const baseTicker = ticker.split(".")[0];
  const fromRankings = stocksByTicker().get(baseTicker);
  if (fromRankings) return fromRankings;

  const cap = marketCapBillions.get(baseTicker) ?? marketCapBillions.get(ticker);
  const history = buildPriceHistory(baseTicker, 0);
  const marketCap =
    cap && cap > 0 ? cap : Math.max(0.05, (hashSeed(baseTicker) % 50) / 10);

  return {
    ticker: baseTicker,
    marketCap,
    peRatio: PE_BY_TICKER[baseTicker] ?? null,
    priceHistory: history,
    logoUrl: normalizeClientLogoUrl(null, baseTicker) ?? "",
  };
}

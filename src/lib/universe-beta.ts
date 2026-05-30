import { GOLD_SILVER_STOCK_SEED } from "@/lib/gold-silver-stocks-seed-data";
import { getGoldPriceHistory, getPriceHistory, getSilverPriceHistory, normalizeTicker } from "@/lib/polygon";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";
import type { StockSubCategory } from "@/lib/tracked-stocks";
import {
  BETA_WINDOW_DAYS,
  computeReturnBeta,
  type MetalProxy,
  type TorqueInputs,
} from "@/lib/torque";

/** Minimum valid betas required before universe-relative normalization is trusted. */
export const MIN_UNIVERSE_BETA_COUNT = 10;

/** Max tickers sampled per metal when building universe beta stats (rate-limit guard). */
export const UNIVERSE_BETA_SAMPLE_SIZE = 80;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SILVER_TICKERS = new Set(
  [
    "PAAS",
    "AG",
    "HL",
    "CDE",
    "EXK",
    "FSM",
    "MAG",
    "SVM",
    "USA",
    "WPM",
    "SIL",
    "SILJ",
    "SLV",
    "SIVR",
    "PSLV",
    "AGQ",
    "SLVR",
  ].map(normalizeTicker),
);

export type UniverseBetaStats = {
  metalProxy: MetalProxy;
  medianBeta: number;
  minBeta: number;
  maxBeta: number;
  validBetaCount: number;
  sampledTickers: number;
  asOf: string;
};

type CacheEntry = { stats: UniverseBetaStats | null; loadedAt: number };
const statsCache = new Map<MetalProxy, CacheEntry>();

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Resolves GLD vs SLV proxy for a ticker using tracked metadata or heuristics.
 */
export function resolveMetalProxy(ticker: string, subCategory?: StockSubCategory | null): MetalProxy {
  if (subCategory === "silver") return "SLV";
  const sym = normalizeTicker(ticker);
  if (SILVER_TICKERS.has(sym)) return "SLV";
  return "GLD";
}

function loadUniverseTickers(metal: MetalProxy): string[] {
  const tracked = loadTrackedStocksSync();
  const fromTracked =
    tracked.length >= MIN_UNIVERSE_BETA_COUNT
      ? tracked
          .filter((s) => resolveMetalProxy(s.ticker, s.sub_category) === metal)
          .map((s) => normalizeTicker(s.ticker))
      : [];

  if (fromTracked.length >= MIN_UNIVERSE_BETA_COUNT) {
    return fromTracked.slice(0, UNIVERSE_BETA_SAMPLE_SIZE);
  }

  const fromSeed = GOLD_SILVER_STOCK_SEED.filter(
    (s) => resolveMetalProxy(s.ticker) === metal && !s.ticker.includes("."),
  ).map((s) => normalizeTicker(s.ticker));

  const merged = [...new Set([...fromTracked, ...fromSeed])];
  return merged.slice(0, UNIVERSE_BETA_SAMPLE_SIZE);
}

/**
 * Builds (or returns cached) universe beta distribution for GLD or SLV cohorts.
 */
export async function getUniverseBetaStats(metal: MetalProxy): Promise<UniverseBetaStats | null> {
  const cached = statsCache.get(metal);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.stats;
  }

  const tickers = loadUniverseTickers(metal);
  const metalHistory =
    metal === "SLV" ? await getSilverPriceHistory(400) : await getGoldPriceHistory(400);
  if (!metalHistory.ok || metalHistory.data.length < BETA_WINDOW_DAYS) {
    statsCache.set(metal, { stats: null, loadedAt: Date.now() });
    return null;
  }

  const betas: number[] = [];
  for (const ticker of tickers) {
    const history = await getPriceHistory(ticker, 400);
    if (!history.ok) continue;
    const regression = computeReturnBeta(history.data, metalHistory.data);
    if (regression) betas.push(regression.beta);
  }

  if (betas.length < MIN_UNIVERSE_BETA_COUNT) {
    statsCache.set(metal, { stats: null, loadedAt: Date.now() });
    return null;
  }

  const stats: UniverseBetaStats = {
    metalProxy: metal,
    medianBeta: median(betas),
    minBeta: Math.min(...betas),
    maxBeta: Math.max(...betas),
    validBetaCount: betas.length,
    sampledTickers: tickers.length,
    asOf: new Date().toISOString(),
  };

  statsCache.set(metal, { stats, loadedAt: Date.now() });
  return stats;
}

/**
 * Builds torque normalization inputs for one ticker from universe stats.
 */
export async function buildTorqueInputs(
  ticker: string,
  stockBars: import("@/lib/polygon").DailyBar[],
  metalBars: import("@/lib/polygon").DailyBar[],
  subCategory?: StockSubCategory | null,
): Promise<{ regression: ReturnType<typeof computeReturnBeta>; torqueInputs: TorqueInputs }> {
  const metalProxy = resolveMetalProxy(ticker, subCategory);
  const regression = computeReturnBeta(stockBars, metalBars);
  const universe = await getUniverseBetaStats(metalProxy);

  const torqueInputs: TorqueInputs = {
    beta: regression?.beta ?? null,
    rSquared: regression?.rSquared ?? null,
    universeMedianBeta: universe?.medianBeta ?? null,
    universeMinBeta: universe?.minBeta ?? null,
    universeMaxBeta: universe?.maxBeta ?? null,
    universeValidBetaCount: universe?.validBetaCount ?? 0,
    metalProxy,
  };

  return { regression, torqueInputs };
}

/** Clears cached universe stats (for tests). */
export function clearUniverseBetaCache(): void {
  statsCache.clear();
}

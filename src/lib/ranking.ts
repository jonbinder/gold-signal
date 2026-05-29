import { createSupabaseServiceClient } from "@/lib/supabase";
import type { DailyBar, FinancialsBundle, InsiderTransaction, InstitutionalOwnership } from "@/lib/polygon";
import {
  getFinancials,
  getGoldPriceHistory,
  getInsiderTransactions,
  getInstitutionalOwnership,
  getPriceHistory,
  getStockPrice,
  getTickerDetails,
  normalizeTicker,
} from "@/lib/polygon";
import type { EdgarInsiderFiling } from "@/lib/sec-edgar";
import { getInsiderTransactions as getEdgarInsiderFilings } from "@/lib/sec-edgar";

/** Gold/silver mining sector median PE — adjustable benchmark. */
export const SECTOR_PE_MEDIAN = 18;

export const SIGNAL_WEIGHTS = {
  institutional: 0.15,
  insider: 0.2,
  pe: 0.1,
  famousInvestor: 0.2,
  support: 0.1,
  correlation: 0.1,
  fcfYield: 0.15,
} as const;

export const NEUTRAL_SCORE = 50;

export type SubScoreKey = keyof typeof SIGNAL_WEIGHTS;

export type SubScoreResult = {
  score: number;
  weight: number;
  weightedContribution: number;
  missing: boolean;
  note: string;
};

export type RankingInputs = {
  ticker: string;
  companyName?: string | null;
  institutional?: {
    ownershipPercent: number | null;
    previousOwnershipPercent: number | null;
  } | null;
  insider?: {
    netDollarValue90d: number | null;
  } | null;
  pe?: {
    trailingPe: number | null;
    sectorMedianPe?: number;
  } | null;
  famousInvestor?: {
    holderCount: number;
  } | null;
  support?: {
    currentPrice: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  } | null;
  correlation?: {
    correlation180d: number | null;
  } | null;
  fcfYield?: {
    fcfYieldPercent: number | null;
  } | null;
};

export type StockRankingResult = {
  ticker: string;
  companyName: string | null;
  signalScore: number;
  /** Count of sub-scores computed from real data (0–7). */
  signalCoverage: number;
  subScores: Record<SubScoreKey, SubScoreResult>;
  rawMetrics: Record<string, unknown>;
};

export type WeightedSignalInput = {
  score: number;
  weight: number;
  /** True when data was unavailable and the sub-score is excluded from the composite. */
  defaulted: boolean;
};

export type PortfolioRankingResult = {
  averageSignalScore: number;
  letterGrade: string;
  stockCount: number;
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Maps a numeric value to a score using ordered bands (first matching band wins).
 */
export function scoreFromBands(
  value: number,
  bands: { upTo: number; scoreMin: number; scoreMax: number }[],
): number {
  for (const band of bands) {
    if (value <= band.upTo) {
      const mid = (band.scoreMin + band.scoreMax) / 2;
      return clampScore(mid);
    }
  }
  const last = bands[bands.length - 1];
  return clampScore((last.scoreMin + last.scoreMax) / 2);
}

/**
 * Signal 1 — Institutional 13F (15%): ownership level and quarter-over-quarter trend.
 */
export function scoreInstitutional(input: RankingInputs["institutional"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.institutional;
  if (!input || input.ownershipPercent == null) {
    return {
      score: NEUTRAL_SCORE,
      weight,
      weightedContribution: NEUTRAL_SCORE * weight,
      missing: true,
      note: "Institutional ownership data unavailable",
    };
  }

  const current = input.ownershipPercent;
  const previous = input.previousOwnershipPercent ?? current;
  const delta = current - previous;

  let score: number;
  if (delta < -2) {
    score = delta < -5 ? scoreFromBands(Math.abs(delta), [{ upTo: Infinity, scoreMin: 0, scoreMax: 19 }]) : 32;
  } else if (delta > 2) {
    if (current > 40) score = 90;
    else if (current >= 20) score = 72;
    else score = 65;
  } else {
    score = 55;
  }

  score = clampScore(score);
  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `Institutional ownership ${current.toFixed(1)}% (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% QoQ)`,
  };
}

/** Routine option exercises / grants to exclude from insider net flow. */
const INSIDER_EXCLUDE_CODES = new Set(["M", "A", "G", "C", "F", "J", "L"]);

/**
 * Signal 2 — Insider buying vs selling (20%): net open-market dollar flow, last 90 days.
 */
export function scoreInsider(input: RankingInputs["insider"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.insider;
  if (!input || input.netDollarValue90d == null) {
    return {
      score: NEUTRAL_SCORE,
      weight,
      weightedContribution: NEUTRAL_SCORE * weight,
      missing: true,
      note: "Insider transaction data unavailable",
    };
  }

  const net = input.netDollarValue90d;
  let score: number;
  if (net > 1_000_000) score = 92;
  else if (net > 100_000) score = 77;
  else if (net >= 0) score = 60;
  else if (net > -500_000) score = 40;
  else score = 15;

  score = clampScore(score);
  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `Net insider flow (90d): $${(net / 1000).toFixed(0)}K`,
  };
}

/**
 * Signal 3 — PE ratio vs sector median (10%).
 */
export function scorePe(input: RankingInputs["pe"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.pe;
  const median = input?.sectorMedianPe ?? SECTOR_PE_MEDIAN;

  if (!input || input.trailingPe == null || input.trailingPe <= 0) {
    return {
      score: input?.trailingPe != null && input.trailingPe <= 0 ? 12 : NEUTRAL_SCORE,
      weight,
      weightedContribution: (input?.trailingPe != null && input.trailingPe <= 0 ? 12 : NEUTRAL_SCORE) * weight,
      missing: input?.trailingPe == null,
      note:
        input?.trailingPe != null && input.trailingPe <= 0
          ? "Negative or zero trailing earnings"
          : "Trailing PE unavailable",
    };
  }

  const ratio = input.trailingPe / median;
  const score = clampScore(
    scoreFromBands(ratio, [
      { upTo: 0.6, scoreMin: 85, scoreMax: 100 },
      { upTo: 0.9, scoreMin: 65, scoreMax: 84 },
      { upTo: 1.1, scoreMin: 45, scoreMax: 64 },
      { upTo: 1.5, scoreMin: 25, scoreMax: 44 },
      { upTo: Infinity, scoreMin: 0, scoreMax: 24 },
    ]),
  );

  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `Trailing PE ${input.trailingPe.toFixed(1)} vs sector median ${median}`,
  };
}

/**
 * Signal 4 — Famous investor holdings (20%).
 */
export function scoreFamousInvestor(input: RankingInputs["famousInvestor"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.famousInvestor;
  if (!input) {
    return {
      score: NEUTRAL_SCORE,
      weight,
      weightedContribution: NEUTRAL_SCORE * weight,
      missing: true,
      note: "Famous investor data unavailable",
    };
  }

  const count = input.holderCount;
  let score: number;
  if (count >= 4) score = 95;
  else if (count >= 2) score = 82;
  else if (count >= 1) score = 67;
  else score = 40;

  score = clampScore(score);
  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `Held by ${count} tracked precious-metals specialist(s)`,
  };
}

/**
 * Signal 5 — 52-week support / price position (10%).
 */
export function scoreSupport(input: RankingInputs["support"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.support;
  if (!input || input.fiftyTwoWeekHigh <= input.fiftyTwoWeekLow) {
    return {
      score: NEUTRAL_SCORE,
      weight,
      weightedContribution: NEUTRAL_SCORE * weight,
      missing: true,
      note: "52-week range data unavailable",
    };
  }

  const position =
    (input.currentPrice - input.fiftyTwoWeekLow) /
    (input.fiftyTwoWeekHigh - input.fiftyTwoWeekLow);
  const pct = position * 100;

  const score = clampScore(
    scoreFromBands(position, [
      { upTo: 0.15, scoreMin: 75, scoreMax: 90 },
      { upTo: 0.3, scoreMin: 80, scoreMax: 95 },
      { upTo: 0.6, scoreMin: 50, scoreMax: 65 },
      { upTo: 0.85, scoreMin: 35, scoreMax: 49 },
      { upTo: Infinity, scoreMin: 25, scoreMax: 40 },
    ]),
  );

  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `Price ${pct.toFixed(0)}% above 52-week low`,
  };
}

/**
 * Signal 6 — Gold price correlation via GLD (10%).
 */
export function scoreCorrelation(input: RankingInputs["correlation"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.correlation;
  if (!input || input.correlation180d == null) {
    return {
      score: NEUTRAL_SCORE,
      weight,
      weightedContribution: NEUTRAL_SCORE * weight,
      missing: true,
      note: "Gold correlation data unavailable",
    };
  }

  const r = input.correlation180d;
  const score = clampScore(
    scoreFromBands(r, [
      { upTo: 0.1, scoreMin: 0, scoreMax: 29 },
      { upTo: 0.3, scoreMin: 30, scoreMax: 49 },
      { upTo: 0.5, scoreMin: 50, scoreMax: 69 },
      { upTo: 0.7, scoreMin: 70, scoreMax: 84 },
      { upTo: Infinity, scoreMin: 85, scoreMax: 100 },
    ]),
  );

  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `180-day gold correlation ${r.toFixed(2)}`,
  };
}

/**
 * Signal 7 — Free cash flow yield (15%).
 */
export function scoreFcfYield(input: RankingInputs["fcfYield"]): SubScoreResult {
  const weight = SIGNAL_WEIGHTS.fcfYield;
  if (!input || input.fcfYieldPercent == null) {
    return {
      score: NEUTRAL_SCORE,
      weight,
      weightedContribution: NEUTRAL_SCORE * weight,
      missing: true,
      note: "Free cash flow yield unavailable",
    };
  }

  const y = input.fcfYieldPercent;
  let score: number;
  if (y < 0) score = 15;
  else if (y <= 2) score = 40;
  else if (y <= 5) score = 60;
  else if (y <= 10) score = 77;
  else score = 92;

  score = clampScore(score);
  return {
    score,
    weight,
    weightedContribution: score * weight,
    missing: false,
    note: `Free cash flow yield ${y.toFixed(1)}%`,
  };
}

/**
 * Composite SignalScore from sub-scores with real data only; weights renormalize to 100%.
 */
export function computeWeightedSignalScore(signals: WeightedSignalInput[]): number {
  const realSignals = signals.filter((s) => !s.defaulted);
  if (realSignals.length === 0) {
    return NEUTRAL_SCORE;
  }

  const totalRealWeight = realSignals.reduce((sum, s) => sum + s.weight, 0);
  if (totalRealWeight <= 0) {
    return NEUTRAL_SCORE;
  }

  const weightedSum = realSignals.reduce((sum, s) => sum + s.score * s.weight, 0);
  return clampScore(weightedSum / totalRealWeight);
}

/**
 * Effective weights after excluding defaulted signals (sums to 1 when any real signal exists).
 */
export function computeEffectiveWeights(
  subScores: Record<SubScoreKey, SubScoreResult>,
): Partial<Record<SubScoreKey, number>> {
  const real = (Object.keys(SIGNAL_WEIGHTS) as SubScoreKey[]).filter((key) => !subScores[key].missing);
  const totalRealWeight = real.reduce((sum, key) => sum + subScores[key].weight, 0);
  if (totalRealWeight <= 0) {
    return {};
  }

  const effective: Partial<Record<SubScoreKey, number>> = {};
  for (const key of Object.keys(SIGNAL_WEIGHTS) as SubScoreKey[]) {
    if (subScores[key].missing) {
      continue;
    }
    effective[key] = subScores[key].weight / totalRealWeight;
  }
  return effective;
}

export function countSignalCoverage(subScores: Record<SubScoreKey, SubScoreResult>): number {
  return (Object.keys(SIGNAL_WEIGHTS) as SubScoreKey[]).filter((key) => !subScores[key].missing).length;
}

/**
 * Computes weighted SignalScore (0–100) from seven sub-scores.
 */
export function computeSignalScore(subScores: Record<SubScoreKey, SubScoreResult>): number {
  const signals = (Object.keys(SIGNAL_WEIGHTS) as SubScoreKey[]).map((key) => ({
    score: subScores[key].score,
    weight: subScores[key].weight,
    defaulted: subScores[key].missing,
  }));
  return computeWeightedSignalScore(signals);
}

/**
 * Ranks a single stock from precomputed signal inputs (pure, testable).
 */
export function rankStock(inputs: RankingInputs): StockRankingResult {
  const subScores: Record<SubScoreKey, SubScoreResult> = {
    institutional: scoreInstitutional(inputs.institutional),
    insider: scoreInsider(inputs.insider),
    pe: scorePe(inputs.pe),
    famousInvestor: scoreFamousInvestor(inputs.famousInvestor),
    support: scoreSupport(inputs.support),
    correlation: scoreCorrelation(inputs.correlation),
    fcfYield: scoreFcfYield(inputs.fcfYield),
  };

  for (const key of Object.keys(SIGNAL_WEIGHTS) as SubScoreKey[]) {
    if (subScores[key].missing) {
      subScores[key] = { ...subScores[key], weightedContribution: 0 };
    }
  }

  const signalCoverage = countSignalCoverage(subScores);
  const effectiveWeights = computeEffectiveWeights(subScores);

  const rawMetrics: Record<string, unknown> = {
    inputs,
    signalCoverage,
    effectiveWeights,
    subScores: Object.fromEntries(
      Object.entries(subScores).map(([k, v]) => [k, { score: v.score, missing: v.missing, note: v.note }]),
    ),
  };

  return {
    ticker: normalizeTicker(inputs.ticker),
    companyName: inputs.companyName ?? null,
    signalScore: computeSignalScore(subScores),
    signalCoverage,
    subScores,
    rawMetrics,
  };
}

/**
 * Maps average portfolio SignalScore to a letter grade.
 */
export function letterGradeFromScore(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  if (score >= 40) return "D";
  return "F";
}

/**
 * Portfolio-level average SignalScore and letter grade.
 */
export function calculatePortfolioScore(
  rankings: Pick<StockRankingResult, "signalScore">[],
): PortfolioRankingResult {
  if (rankings.length === 0) {
    return { averageSignalScore: 0, letterGrade: "F", stockCount: 0 };
  }
  const avg =
    rankings.reduce((sum, r) => sum + r.signalScore, 0) / rankings.length;
  const averageSignalScore = clampScore(avg);
  return {
    averageSignalScore,
    letterGrade: letterGradeFromScore(averageSignalScore),
    stockCount: rankings.length,
  };
}

/**
 * Pearson correlation of daily percent returns between two price series (aligned by date).
 */
export function computeReturnCorrelation(seriesA: DailyBar[], seriesB: DailyBar[]): number | null {
  const mapB = new Map(seriesB.map((b) => [b.date, b.close]));
  const returnsA: number[] = [];
  const returnsB: number[] = [];

  for (let i = 1; i < seriesA.length; i++) {
    const prev = seriesA[i - 1];
    const cur = seriesA[i];
    const closeB = mapB.get(cur.date);
    const prevCloseB = mapB.get(prev.date);
    if (closeB == null || prevCloseB == null || prev.close <= 0 || prevCloseB <= 0) continue;
    returnsA.push((cur.close - prev.close) / prev.close);
    returnsB.push((closeB - prevCloseB) / prevCloseB);
  }

  const n = Math.min(returnsA.length, returnsB.length);
  if (n < 20) return null;

  const a = returnsA.slice(-n);
  const b = returnsB.slice(-n);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  if (denA === 0 || denB === 0) return null;
  return num / Math.sqrt(denA * denB);
}

function fiftyTwoWeekRange(bars: DailyBar[]): { high: number; low: number } | null {
  if (bars.length === 0) return null;
  let high = -Infinity;
  let low = Infinity;
  for (const b of bars) {
    if (b.high > high) high = b.high;
    if (b.low < low) low = b.low;
  }
  if (!Number.isFinite(high) || !Number.isFinite(low) || high <= low) return null;
  return { high, low };
}

function sumLast4Quarters(
  financials: FinancialsBundle,
  field: keyof FinancialsBundle["quarters"][0],
): number | null {
  const values = financials.quarters
    .slice(0, 4)
    .map((q) => q[field])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0);
}

/**
 * Aggregates Polygon/SEC insider rows into net dollar value (buys minus sells), excluding routine exercises.
 */
export function aggregateInsiderNetDollars(
  polygonRows: InsiderTransaction[] | null,
  edgarFilings: EdgarInsiderFiling[] | null,
): { netDollarValue90d: number | null; source: string } {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let net = 0;
  let count = 0;

  if (polygonRows?.length) {
    for (const row of polygonRows) {
      const code = row.transactionCode?.toUpperCase() ?? "";
      if (INSIDER_EXCLUDE_CODES.has(code)) continue;
      const dateStr = row.transactionDate ?? row.filingDate;
      if (!dateStr) continue;
      const ts = Date.parse(dateStr);
      if (Number.isNaN(ts) || ts < cutoff) continue;

      const value =
        row.value ??
        (row.shares != null && row.pricePerShare != null ? row.shares * row.pricePerShare : null);
      if (value == null || !Number.isFinite(value)) continue;

      const side = row.acquiredDisposed?.toUpperCase();
      if (side === "A" || side === "ACQUIRED") net += value;
      else if (side === "D" || side === "DISPOSED") net -= value;
      else if (row.transactionCode === "P") net += value;
      else if (row.transactionCode === "S") net -= value;
      count++;
    }
    if (count > 0) return { netDollarValue90d: net, source: "polygon" };
  }

  if (edgarFilings?.length) {
    const recent = edgarFilings.filter((f) => {
      const ts = Date.parse(f.filingDate);
      return !Number.isNaN(ts) && ts >= cutoff;
    });
    if (recent.length > 0) {
      return { netDollarValue90d: null, source: "sec-edgar-metadata-only" };
    }
  }

  return { netDollarValue90d: null, source: "none" };
}

/**
 * Counts famous_investors rows for a ticker from Supabase.
 */
export async function countFamousInvestorsForTicker(ticker: string): Promise<number> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return 0;
  const sym = normalizeTicker(ticker);
  const { count, error } = await supabase
    .from("famous_investors")
    .select("id", { count: "exact", head: true })
    .eq("ticker", sym);
  if (error) {
    console.warn(`[ranking] famous_investors query failed for ${sym}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Fetches market data and produces a full StockRankingResult for one ticker.
 */
export async function rankStockFromMarketData(ticker: string): Promise<StockRankingResult> {
  const sym = normalizeTicker(ticker);
  const rawMetrics: Record<string, unknown> = { ticker: sym, fetchedAt: new Date().toISOString() };

  const [priceRes, detailsRes, financialsRes, historyRes, goldRes, instRes, insiderRes, edgarRes, famousCount] =
    await Promise.all([
      getStockPrice(sym),
      getTickerDetails(sym),
      getFinancials(sym),
      getPriceHistory(sym, 365),
      getGoldPriceHistory(365),
      getInstitutionalOwnership(sym),
      getInsiderTransactions(sym),
      getEdgarInsiderFilings(sym),
      countFamousInvestorsForTicker(sym),
    ]);

  rawMetrics.price = priceRes;
  rawMetrics.details = detailsRes;
  rawMetrics.financials = financialsRes;
  rawMetrics.history = historyRes.ok ? { barCount: historyRes.data.length } : historyRes;
  rawMetrics.gold = goldRes.ok ? { barCount: goldRes.data.length } : goldRes;
  rawMetrics.institutional = instRes;
  rawMetrics.insider = insiderRes;
  rawMetrics.edgarInsider = edgarRes;

  const companyName = detailsRes.ok ? detailsRes.data.name : null;
  const currentPrice = priceRes.ok ? priceRes.data.close : null;
  const marketCap = detailsRes.ok ? detailsRes.data.marketCap : null;
  const shares = detailsRes.ok ? detailsRes.data.sharesOutstanding : null;

  let institutional: RankingInputs["institutional"] = null;
  if (instRes.ok && instRes.data) {
    const o = instRes.data as InstitutionalOwnership;
    institutional = {
      ownershipPercent: o.ownershipPercent,
      previousOwnershipPercent: null,
    };
    rawMetrics.institutionalNote = "Previous quarter ownership not available from Polygon; trend treated as flat.";
  }

  const insiderAgg = aggregateInsiderNetDollars(
    insiderRes.ok ? insiderRes.data : null,
    edgarRes.ok ? edgarRes.data : null,
  );
  rawMetrics.insiderAggregation = insiderAgg;

  let pe: RankingInputs["pe"] = null;
  if (financialsRes.ok && currentPrice != null && shares != null && shares > 0) {
    const netIncome = sumLast4Quarters(financialsRes.data, "netIncome");
    if (netIncome != null) {
      const eps = netIncome / shares;
      pe = { trailingPe: eps > 0 ? currentPrice / eps : -1 };
    }
  }

  let fcfYield: RankingInputs["fcfYield"] = null;
  if (financialsRes.ok && marketCap != null && marketCap > 0) {
    const fcf = sumLast4Quarters(financialsRes.data, "freeCashFlow");
    if (fcf != null) {
      fcfYield = { fcfYieldPercent: (fcf / marketCap) * 100 };
    }
  }

  let support: RankingInputs["support"] = null;
  if (historyRes.ok && currentPrice != null) {
    const range = fiftyTwoWeekRange(historyRes.data);
    if (range) {
      support = {
        currentPrice,
        fiftyTwoWeekHigh: range.high,
        fiftyTwoWeekLow: range.low,
      };
    }
  }

  let correlation: RankingInputs["correlation"] = null;
  if (historyRes.ok && goldRes.ok) {
    const corr = computeReturnCorrelation(historyRes.data, goldRes.data);
    correlation = { correlation180d: corr };
  }

  const inputs: RankingInputs = {
    ticker: sym,
    companyName,
    institutional,
    insider: insiderAgg.netDollarValue90d != null ? { netDollarValue90d: insiderAgg.netDollarValue90d } : null,
    pe,
    famousInvestor: { holderCount: famousCount },
    support,
    correlation,
    fcfYield,
  };

  const result = rankStock(inputs);
  result.rawMetrics = { ...rawMetrics, ...result.rawMetrics };
  return result;
}

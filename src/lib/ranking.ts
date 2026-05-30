import { createSupabaseServiceClient } from "@/lib/supabase";
import type { DailyBar, FinancialsBundle, InsiderTransaction, InstitutionalOwnership } from "@/lib/polygon";
import {
  getFinancials,
  getGoldPriceHistory,
  getInsiderTransactions,
  getInstitutionalOwnership,
  getPriceHistory,
  getSilverPriceHistory,
  getStockPrice,
  getTickerDetails,
  normalizeTicker,
} from "@/lib/polygon";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";
import type { EdgarInsiderFiling } from "@/lib/sec-edgar";
import { getInsiderTransactions as getEdgarInsiderFilings } from "@/lib/sec-edgar";
import { buildTorqueInputs, resolveMetalProxy } from "@/lib/universe-beta";
import { computeTorqueMultiplier, type TorqueInputs } from "@/lib/torque";

/** Gold/silver mining sector median PE — adjustable benchmark (dormant context metric). */
export const SECTOR_PE_MEDIAN = 18;

/** Scored smart-money footprints (renormalize across AVAILABLE). */
export const FOOTPRINT_WEIGHTS = {
  insider: 0.45,
  institutional: 0.3,
  famousInvestor: 0.25,
} as const;

/** Legacy weights for dormant context signals (not scored in v3). */
export const DORMANT_SIGNAL_WEIGHTS = {
  pe: 0.1,
  support: 0.1,
  correlation: 0.1,
  fcfYield: 0.15,
} as const;

/** @deprecated Use FOOTPRINT_WEIGHTS + DORMANT_SIGNAL_WEIGHTS. Kept for DB column mapping. */
export const SIGNAL_WEIGHTS = {
  institutional: FOOTPRINT_WEIGHTS.institutional,
  insider: FOOTPRINT_WEIGHTS.insider,
  famousInvestor: FOOTPRINT_WEIGHTS.famousInvestor,
  pe: DORMANT_SIGNAL_WEIGHTS.pe,
  support: DORMANT_SIGNAL_WEIGHTS.support,
  correlation: DORMANT_SIGNAL_WEIGHTS.correlation,
  fcfYield: DORMANT_SIGNAL_WEIGHTS.fcfYield,
} as const;

export const FOOTPRINT_KEYS = ["insider", "institutional", "famousInvestor"] as const;
export type FootprintKey = (typeof FOOTPRINT_KEYS)[number];

export const DORMANT_SIGNAL_KEYS = ["pe", "support", "fcfYield", "correlation"] as const;
export type DormantSignalKey = (typeof DORMANT_SIGNAL_KEYS)[number];

export const FOOTPRINT_COUNT = FOOTPRINT_KEYS.length;
/** @deprecated Use FOOTPRINT_COUNT. */
export const SIGNAL_COUNT = FOOTPRINT_COUNT;
export const SCORING_VERSION = 3;

export type SignalAvailability = "AVAILABLE" | "UNAVAILABLE";
export type ConfidenceTier = "high" | "medium" | "low" | "none";

export type SubScoreKey = keyof typeof SIGNAL_WEIGHTS;

export type SubScoreResult = {
  score: number | null;
  weight: number;
  weightedContribution: number;
  availability: SignalAvailability;
  /** True when availability is UNAVAILABLE (legacy alias). */
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
  /** Precomputed torque normalization inputs (optional in unit tests). */
  torque?: TorqueInputs | null;
};

export type StockRankingResult = {
  ticker: string;
  companyName: string | null;
  /** Display score (0–100 clamp). Null when no footprint data exists. */
  signalScore: number | null;
  /** Unclamped SmartMoneyBase × torqueMultiplier — use for sorting. */
  signalScoreRaw: number | null;
  /** False when zero footprints are AVAILABLE (no fabricated score). */
  scoreAvailable: boolean;
  smartMoneyBase: number | null;
  torqueMultiplier: number;
  /** Count of AVAILABLE footprint signals (0–3). */
  signalCoverage: number;
  coveragePercent: number;
  confidenceTier: ConfidenceTier;
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

function unavailableSubScore(weight: number, note: string): SubScoreResult {
  return {
    score: null,
    weight,
    weightedContribution: 0,
    availability: "UNAVAILABLE",
    missing: true,
    note,
  };
}

function availableSubScore(score: number, weight: number, note: string): SubScoreResult {
  const clamped = clampScore(score);
  return {
    score: clamped,
    weight,
    weightedContribution: clamped * weight,
    availability: "AVAILABLE",
    missing: false,
    note,
  };
}

/** True when a sub-score has real data and participates in the composite. */
export function isSignalAvailable(sub: SubScoreResult): boolean {
  return sub.availability === "AVAILABLE" && sub.score != null;
}

export function coveragePercentFromCount(availableCount: number): number {
  return Math.round((availableCount / SIGNAL_COUNT) * 100);
}

export function confidenceTierFromCoverage(availableCount: number): ConfidenceTier {
  if (availableCount >= 3) return "high";
  if (availableCount >= 2) return "medium";
  if (availableCount >= 1) return "low";
  return "none";
}

export function buildSignalAvailabilityMap(
  subScores: Record<SubScoreKey, SubScoreResult>,
): Record<SubScoreKey, SignalAvailability> {
  const map = {} as Record<SubScoreKey, SignalAvailability>;
  for (const key of Object.keys(SIGNAL_WEIGHTS) as SubScoreKey[]) {
    map[key] = subScores[key].availability;
  }
  return map;
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
  const weight = FOOTPRINT_WEIGHTS.institutional;
  if (!input || input.ownershipPercent == null) {
    return unavailableSubScore(weight, "Institutional ownership data unavailable");
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
  return availableSubScore(
    score,
    weight,
    `Institutional ownership ${current.toFixed(1)}% (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% QoQ)`,
  );
}

/** Routine option exercises / grants to exclude from insider net flow. */
const INSIDER_EXCLUDE_CODES = new Set(["M", "A", "G", "C", "F", "J", "L"]);

/**
 * Signal 2 — Insider buying vs selling (20%): net open-market dollar flow, last 90 days.
 */
export function scoreInsider(input: RankingInputs["insider"]): SubScoreResult {
  const weight = FOOTPRINT_WEIGHTS.insider;
  if (!input || input.netDollarValue90d == null) {
    return unavailableSubScore(weight, "Insider transaction data unavailable");
  }

  const net = input.netDollarValue90d;
  let score: number;
  if (net > 1_000_000) score = 92;
  else if (net > 100_000) score = 77;
  else if (net >= 0) score = 60;
  else if (net > -500_000) score = 40;
  else score = 15;

  score = clampScore(score);
  return availableSubScore(score, weight, `Net insider flow (90d): $${(net / 1000).toFixed(0)}K`);
}

/**
 * Signal 3 — PE ratio vs sector median (10%).
 */
export function scorePe(input: RankingInputs["pe"]): SubScoreResult {
  const weight = DORMANT_SIGNAL_WEIGHTS.pe;
  const median = input?.sectorMedianPe ?? SECTOR_PE_MEDIAN;

  if (!input || input.trailingPe == null) {
    return unavailableSubScore(weight, "Trailing PE unavailable");
  }

  if (input.trailingPe <= 0) {
    return availableSubScore(12, weight, "Negative or zero trailing earnings");
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

  return availableSubScore(
    score,
    weight,
    `Trailing PE ${input.trailingPe.toFixed(1)} vs sector median ${median}`,
  );
}

/**
 * Signal 4 — Famous investor holdings (20%).
 */
export function scoreFamousInvestor(input: RankingInputs["famousInvestor"]): SubScoreResult {
  const weight = FOOTPRINT_WEIGHTS.famousInvestor;
  if (!input) {
    return unavailableSubScore(weight, "Famous investor data unavailable");
  }

  const count = input.holderCount;
  let score: number;
  if (count >= 4) score = 95;
  else if (count >= 2) score = 82;
  else if (count >= 1) score = 67;
  else score = 40;

  score = clampScore(score);
  return availableSubScore(
    score,
    weight,
    `Held by ${count} tracked precious-metals specialist(s)`,
  );
}

/**
 * Signal 5 — 52-week support / price position (10%).
 */
export function scoreSupport(input: RankingInputs["support"]): SubScoreResult {
  const weight = DORMANT_SIGNAL_WEIGHTS.support;
  if (!input || input.fiftyTwoWeekHigh <= input.fiftyTwoWeekLow) {
    return unavailableSubScore(weight, "52-week range data unavailable");
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

  return availableSubScore(score, weight, `Price ${pct.toFixed(0)}% above 52-week low`);
}

/**
 * Signal 6 — Gold price correlation via GLD (10%).
 */
export function scoreCorrelation(input: RankingInputs["correlation"]): SubScoreResult {
  const weight = DORMANT_SIGNAL_WEIGHTS.correlation;
  if (!input || input.correlation180d == null) {
    return unavailableSubScore(weight, "Gold correlation data unavailable");
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

  return availableSubScore(score, weight, `180-day gold correlation ${r.toFixed(2)}`);
}

/**
 * Signal 7 — Free cash flow yield (15%).
 */
export function scoreFcfYield(input: RankingInputs["fcfYield"]): SubScoreResult {
  const weight = DORMANT_SIGNAL_WEIGHTS.fcfYield;
  if (!input || input.fcfYieldPercent == null) {
    return unavailableSubScore(weight, "Free cash flow yield unavailable");
  }

  const y = input.fcfYieldPercent;
  let score: number;
  if (y < 0) score = 15;
  else if (y <= 2) score = 40;
  else if (y <= 5) score = 60;
  else if (y <= 10) score = 77;
  else score = 92;

  score = clampScore(score);
  return availableSubScore(score, weight, `Free cash flow yield ${y.toFixed(1)}%`);
}

/**
 * Composite weighted average from footprint sub-scores only; null when none available.
 */
export function computeSmartMoneyBase(subScores: Record<SubScoreKey, SubScoreResult>): number | null {
  const signals = FOOTPRINT_KEYS.map((key) => ({
    score: subScores[key].score ?? 0,
    weight: subScores[key].weight,
    defaulted: !isSignalAvailable(subScores[key]),
  }));
  const realSignals = signals.filter((s) => !s.defaulted);
  if (realSignals.length === 0) return null;

  const totalRealWeight = realSignals.reduce((sum, s) => sum + s.weight, 0);
  if (totalRealWeight <= 0) return null;

  const weightedSum = realSignals.reduce((sum, s) => sum + s.score * s.weight, 0);
  return weightedSum / totalRealWeight;
}

/**
 * @deprecated Use computeSmartMoneyBase. Kept for legacy tests/helpers.
 */
export function computeWeightedSignalScore(signals: WeightedSignalInput[]): number | null {
  const realSignals = signals.filter((s) => !s.defaulted);
  if (realSignals.length === 0) return null;

  const totalRealWeight = realSignals.reduce((sum, s) => sum + s.weight, 0);
  if (totalRealWeight <= 0) return null;

  const weightedSum = realSignals.reduce((sum, s) => sum + s.score * s.weight, 0);
  return clampScore(weightedSum / totalRealWeight);
}

/**
 * Effective footprint weights after excluding unavailable signals (sums to 1 when any exist).
 */
export function computeEffectiveWeights(
  subScores: Record<SubScoreKey, SubScoreResult>,
): Partial<Record<FootprintKey, number>> {
  const real = FOOTPRINT_KEYS.filter((key) => isSignalAvailable(subScores[key]));
  const totalRealWeight = real.reduce((sum, key) => sum + subScores[key].weight, 0);
  if (totalRealWeight <= 0) {
    return {};
  }

  const effective: Partial<Record<FootprintKey, number>> = {};
  for (const key of FOOTPRINT_KEYS) {
    if (!isSignalAvailable(subScores[key])) continue;
    effective[key] = subScores[key].weight / totalRealWeight;
  }
  return effective;
}

export function countSignalCoverage(subScores: Record<SubScoreKey, SubScoreResult>): number {
  return FOOTPRINT_KEYS.filter((key) => isSignalAvailable(subScores[key])).length;
}

/**
 * Computes display + raw final scores from SmartMoneyBase and torque multiplier.
 */
export function computeFinalScore(
  smartMoneyBase: number | null,
  torqueMultiplier: number,
): { signalScore: number | null; signalScoreRaw: number | null; scoreAvailable: boolean } {
  if (smartMoneyBase == null) {
    return { signalScore: null, signalScoreRaw: null, scoreAvailable: false };
  }
  const raw = smartMoneyBase * torqueMultiplier;
  return {
    signalScoreRaw: raw,
    signalScore: clampScore(raw),
    scoreAvailable: true,
  };
}

/**
 * @deprecated Use computeSmartMoneyBase + computeFinalScore (v3 model).
 */
export function computeSignalScore(subScores: Record<SubScoreKey, SubScoreResult>): number | null {
  const base = computeSmartMoneyBase(subScores);
  if (base == null) return null;
  return clampScore(base);
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
    if (!isSignalAvailable(subScores[key])) {
      subScores[key] = { ...subScores[key], weightedContribution: 0 };
    }
  }

  const footprintAvailability = Object.fromEntries(
    FOOTPRINT_KEYS.map((key) => [key, subScores[key].availability]),
  ) as Record<FootprintKey, SignalAvailability>;

  const signalCoverage = countSignalCoverage(subScores);
  const coveragePercent = coveragePercentFromCount(signalCoverage);
  const confidenceTier = confidenceTierFromCoverage(signalCoverage);
  const effectiveWeights = computeEffectiveWeights(subScores);
  const smartMoneyBase = computeSmartMoneyBase(subScores);

  const torqueInputs: TorqueInputs = inputs.torque ?? {
    beta: null,
    rSquared: null,
    universeMedianBeta: null,
    universeMinBeta: null,
    universeMaxBeta: null,
    universeValidBetaCount: 0,
    metalProxy: resolveMetalProxy(inputs.ticker),
  };
  const torque = computeTorqueMultiplier(torqueInputs);
  const finalScores = computeFinalScore(smartMoneyBase, torque.torqueMultiplier);

  const rawMetrics: Record<string, unknown> = {
    scoringVersion: SCORING_VERSION,
    model: "smart-money-footprints-x-torque",
    inputs,
    footprintAvailability,
    dormantSignals: DORMANT_SIGNAL_KEYS,
    signalCoverage,
    coveragePercent,
    confidenceTier,
    effectiveWeights,
    smartMoneyBase,
    torqueMultiplier: torque.torqueMultiplier,
    torqueDetail: {
      beta: torqueInputs.beta,
      rSquared: torqueInputs.rSquared,
      r2GateTriggered: torque.r2GateTriggered,
      betaMissing: torque.betaMissing,
      universeFallback: torque.universeFallback,
      universeMedianBeta: torqueInputs.universeMedianBeta,
      universeMinBeta: torqueInputs.universeMinBeta,
      universeMaxBeta: torqueInputs.universeMaxBeta,
      universeValidBetaCount: torqueInputs.universeValidBetaCount,
      metalProxy: torqueInputs.metalProxy,
      note: torque.note,
    },
    signalScoreRaw: finalScores.signalScoreRaw,
    signalScoreDisplay: finalScores.signalScore,
    scoreAvailable: finalScores.scoreAvailable,
    footprintSubScores: Object.fromEntries(
      FOOTPRINT_KEYS.map((key) => [
        key,
        {
          score: subScores[key].score,
          availability: subScores[key].availability,
          missing: subScores[key].missing,
          note: subScores[key].note,
        },
      ]),
    ),
    contextSubScores: Object.fromEntries(
      DORMANT_SIGNAL_KEYS.map((key) => [
        key,
        {
          score: subScores[key].score,
          availability: subScores[key].availability,
          scored: false,
          note: subScores[key].note,
        },
      ]),
    ),
    subScores: Object.fromEntries(
      Object.entries(subScores).map(([k, v]) => [
        k,
        {
          score: v.score,
          availability: v.availability,
          missing: v.missing,
          note: v.note,
          scored: (FOOTPRINT_KEYS as readonly string[]).includes(k),
        },
      ]),
    ),
  };

  return {
    ticker: normalizeTicker(inputs.ticker),
    companyName: inputs.companyName ?? null,
    signalScore: finalScores.signalScore,
    signalScoreRaw: finalScores.signalScoreRaw,
    scoreAvailable: finalScores.scoreAvailable,
    smartMoneyBase,
    torqueMultiplier: torque.torqueMultiplier,
    signalCoverage,
    coveragePercent,
    confidenceTier,
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
 * Portfolio-level average SignalScore and letter grade (scored stocks only).
 */
export function calculatePortfolioScore(
  rankings: Pick<StockRankingResult, "signalScore" | "scoreAvailable">[],
): PortfolioRankingResult {
  const scored = rankings.filter((r) => r.scoreAvailable && r.signalScore != null);
  if (scored.length === 0) {
    return { averageSignalScore: 0, letterGrade: "F", stockCount: 0 };
  }
  const avg = scored.reduce((sum, r) => sum + (r.signalScore ?? 0), 0) / scored.length;
  const averageSignalScore = clampScore(avg);
  return {
    averageSignalScore,
    letterGrade: letterGradeFromScore(averageSignalScore),
    stockCount: scored.length,
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
 * Returns famous-investor input when the lookup table has data; null if empty/unavailable.
 */
export async function getFamousInvestorRankingInput(
  ticker: string,
): Promise<RankingInputs["famousInvestor"]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const { count: tableCount, error: tableError } = await supabase
    .from("famous_investors")
    .select("id", { count: "exact", head: true });

  if (tableError) {
    console.warn("[ranking] famous_investors table check failed:", tableError.message);
    return null;
  }
  if (!tableCount) {
    return null;
  }

  const sym = normalizeTicker(ticker);
  const { count, error } = await supabase
    .from("famous_investors")
    .select("id", { count: "exact", head: true })
    .eq("ticker", sym);

  if (error) {
    console.warn(`[ranking] famous_investors query failed for ${sym}:`, error.message);
    return null;
  }

  return { holderCount: count ?? 0 };
}

/**
 * Counts famous_investors rows for a ticker from Supabase.
 * @deprecated Prefer getFamousInvestorRankingInput for scoring.
 */
export async function countFamousInvestorsForTicker(ticker: string): Promise<number> {
  const input = await getFamousInvestorRankingInput(ticker);
  return input?.holderCount ?? 0;
}

/**
 * Fetches market data and produces a full StockRankingResult for one ticker.
 */
export async function rankStockFromMarketData(ticker: string): Promise<StockRankingResult> {
  const sym = normalizeTicker(ticker);
  const rawMetrics: Record<string, unknown> = { ticker: sym, fetchedAt: new Date().toISOString() };
  const tracked = loadTrackedStocksSync().find((s) => normalizeTicker(s.ticker) === sym);
  const metalProxy = resolveMetalProxy(sym, tracked?.sub_category ?? null);

  const [priceRes, detailsRes, financialsRes, historyRes, metalRes, instRes, insiderRes, edgarRes, famousCount] =
    await Promise.all([
      getStockPrice(sym),
      getTickerDetails(sym),
      getFinancials(sym),
      getPriceHistory(sym, 400),
      metalProxy === "SLV" ? getSilverPriceHistory(400) : getGoldPriceHistory(400),
      getInstitutionalOwnership(sym),
      getInsiderTransactions(sym),
      getEdgarInsiderFilings(sym),
      getFamousInvestorRankingInput(sym),
    ]);

  rawMetrics.price = priceRes;
  rawMetrics.details = detailsRes;
  rawMetrics.financials = financialsRes;
  rawMetrics.history = historyRes.ok ? { barCount: historyRes.data.length } : historyRes;
  rawMetrics.metalProxy = metalProxy;
  rawMetrics.metal = metalRes.ok ? { barCount: metalRes.data.length } : metalRes;
  rawMetrics.institutional = instRes;
  rawMetrics.insider = insiderRes;
  rawMetrics.edgarInsider = edgarRes;

  let torqueInputs: TorqueInputs | null = null;
  let betaRegression: ReturnType<typeof import("@/lib/torque").computeReturnBeta> = null;
  if (historyRes.ok && metalRes.ok) {
    const built = await buildTorqueInputs(sym, historyRes.data, metalRes.data, tracked?.sub_category ?? null);
    torqueInputs = built.torqueInputs;
    betaRegression = built.regression;
    rawMetrics.torqueRegression = betaRegression;
  }

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
  if (historyRes.ok && metalRes.ok) {
    const corr = computeReturnCorrelation(historyRes.data, metalRes.data);
    correlation = { correlation180d: corr };
  }

  const inputs: RankingInputs = {
    ticker: sym,
    companyName,
    institutional,
    insider: insiderAgg.netDollarValue90d != null ? { netDollarValue90d: insiderAgg.netDollarValue90d } : null,
    pe,
    famousInvestor: famousCount,
    support,
    correlation,
    fcfYield,
    torque: torqueInputs,
  };

  const result = rankStock(inputs);
  result.rawMetrics = { ...rawMetrics, ...result.rawMetrics };
  return result;
}

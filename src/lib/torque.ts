import type { DailyBar } from "@/lib/polygon";

/** Gentle torque band — easy to tune. */
export const TORQUE_MIN = 0.85;
export const TORQUE_MAX = 1.15;

/** Below this R², beta vs metal proxy is treated as noise → neutral multiplier. */
export const R2_FLOOR = 0.15;

/** Trailing window for beta (~1 trading year). */
export const BETA_WINDOW_DAYS = 252;

/** Minimum aligned return pairs required to compute beta. */
export const MIN_BETA_OBSERVATIONS = 60;

export type MetalProxy = "GLD" | "SLV";

export type ReturnRegression = {
  beta: number;
  rSquared: number;
  correlation: number;
  observationCount: number;
  asOf: string | null;
};

export type TorqueInputs = {
  beta: number | null;
  rSquared: number | null;
  universeMedianBeta: number | null;
  universeMinBeta: number | null;
  universeMaxBeta: number | null;
  universeValidBetaCount: number;
  metalProxy: MetalProxy;
};

export type TorqueResult = {
  torqueMultiplier: number;
  r2GateTriggered: boolean;
  betaMissing: boolean;
  universeFallback: boolean;
  note: string;
};

type AlignedReturns = {
  stock: number[];
  metal: number[];
  asOf: string | null;
};

/**
 * Aligns daily percent returns for stock vs metal proxy (newest observations retained).
 */
export function alignDailyReturns(
  stockBars: DailyBar[],
  metalBars: DailyBar[],
  maxPairs = BETA_WINDOW_DAYS,
): AlignedReturns | null {
  const mapMetal = new Map(metalBars.map((b) => [b.date, b.close]));
  const stockReturns: number[] = [];
  const metalReturns: number[] = [];
  let asOf: string | null = null;

  for (let i = 1; i < stockBars.length; i++) {
    const prev = stockBars[i - 1];
    const cur = stockBars[i];
    const closeMetal = mapMetal.get(cur.date);
    const prevCloseMetal = mapMetal.get(prev.date);
    if (closeMetal == null || prevCloseMetal == null || prev.close <= 0 || prevCloseMetal <= 0) {
      continue;
    }
    stockReturns.push((cur.close - prev.close) / prev.close);
    metalReturns.push((closeMetal - prevCloseMetal) / prevCloseMetal);
    asOf = cur.date;
  }

  if (stockReturns.length < MIN_BETA_OBSERVATIONS) {
    return null;
  }

  const n = Math.min(stockReturns.length, maxPairs);
  return {
    stock: stockReturns.slice(-n),
    metal: metalReturns.slice(-n),
    asOf,
  };
}

/**
 * OLS beta of stock returns vs metal proxy returns, with R² = correlation².
 */
export function computeReturnBeta(
  stockBars: DailyBar[],
  metalBars: DailyBar[],
  maxDays = BETA_WINDOW_DAYS,
): ReturnRegression | null {
  const aligned = alignDailyReturns(stockBars, metalBars, maxDays);
  if (!aligned) return null;

  const { stock, metal, asOf } = aligned;
  const n = stock.length;
  const meanStock = stock.reduce((s, v) => s + v, 0) / n;
  const meanMetal = metal.reduce((s, v) => s + v, 0) / n;

  let cov = 0;
  let varMetal = 0;
  let varStock = 0;
  for (let i = 0; i < n; i++) {
    const ds = stock[i] - meanStock;
    const dm = metal[i] - meanMetal;
    cov += ds * dm;
    varMetal += dm * dm;
    varStock += ds * ds;
  }

  if (varMetal === 0 || varStock === 0) return null;

  const beta = cov / varMetal;
  const correlation = cov / Math.sqrt(varStock * varMetal);
  const rSquared = correlation * correlation;

  if (!Number.isFinite(beta) || !Number.isFinite(rSquared)) return null;

  return {
    beta,
    rSquared,
    correlation,
    observationCount: n,
    asOf,
  };
}

/**
 * Maps beta relative to universe distribution into a gentle torque multiplier.
 * Median beta → 1.0; universe min/max approach TORQUE_MIN / TORQUE_MAX.
 */
export function computeTorqueMultiplier(input: TorqueInputs): TorqueResult {
  if (input.beta == null || input.rSquared == null) {
    return {
      torqueMultiplier: 1,
      r2GateTriggered: false,
      betaMissing: true,
      universeFallback: false,
      note: "Beta unavailable — neutral torque (×1.0)",
    };
  }

  if (input.rSquared < R2_FLOOR) {
    return {
      torqueMultiplier: 1,
      r2GateTriggered: true,
      betaMissing: false,
      universeFallback: false,
      note: `R² ${input.rSquared.toFixed(2)} below floor ${R2_FLOOR} — neutral torque (×1.0)`,
    };
  }

  const { universeMedianBeta, universeMinBeta, universeMaxBeta, universeValidBetaCount, beta } =
    input;

  if (
    universeMedianBeta == null ||
    universeMinBeta == null ||
    universeMaxBeta == null ||
    universeValidBetaCount <= 0
  ) {
    return {
      torqueMultiplier: 1,
      r2GateTriggered: false,
      betaMissing: false,
      universeFallback: true,
      note: "Universe beta baseline unavailable — neutral torque (×1.0)",
    };
  }

  let multiplier: number;
  if (beta >= universeMedianBeta) {
    const span = universeMaxBeta - universeMedianBeta;
    if (span <= 0) {
      multiplier = 1;
    } else {
      const t = Math.min(1, (beta - universeMedianBeta) / span);
      multiplier = 1 + t * (TORQUE_MAX - 1);
    }
  } else {
    const span = universeMedianBeta - universeMinBeta;
    if (span <= 0) {
      multiplier = 1;
    } else {
      const t = Math.min(1, (universeMedianBeta - beta) / span);
      multiplier = 1 - t * (1 - TORQUE_MIN);
    }
  }

  multiplier = Math.max(TORQUE_MIN, Math.min(TORQUE_MAX, multiplier));

  return {
    torqueMultiplier: multiplier,
    r2GateTriggered: false,
    betaMissing: false,
    universeFallback: false,
    note: `Beta ${beta.toFixed(2)} vs universe median ${universeMedianBeta.toFixed(2)} (${input.metalProxy}) → ×${multiplier.toFixed(3)}`,
  };
}

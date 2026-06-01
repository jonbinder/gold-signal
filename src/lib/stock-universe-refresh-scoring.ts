/**
 * DORMANT — cache helpers for SignalScore columns. Imported only when SCORING_ENABLED=true.
 * See @/lib/ranking for the scoring engine.
 */
import {
  isSignalAvailable,
  FOOTPRINT_KEYS,
  type FootprintKey,
  type SubScoreKey,
  type StockRankingResult,
} from "@/lib/ranking";

const SUB_SCORE_KEYS = FOOTPRINT_KEYS as readonly FootprintKey[];

export function buildCacheMetricsFromRanking(ranking: StockRankingResult): {
  signalCoverage: number;
  rawMetrics: Record<string, unknown>;
  subScoreColumns: Record<string, number | null>;
} {
  let signalCoverage = 0;
  const rawMetrics: Record<string, unknown> = { ...ranking.rawMetrics };

  const subScoreColumns: Record<string, number | null> = {};

  const columnMap: Record<SubScoreKey, string> = {
    institutional: "institutional_score",
    insider: "insider_score",
    pe: "pe_score",
    famousInvestor: "famous_investor_score",
    support: "support_score",
    correlation: "correlation_score",
    fcfYield: "fcf_yield_score",
  };

  for (const key of SUB_SCORE_KEYS) {
    const sub = ranking.subScores[key];
    if (!isSignalAvailable(sub)) {
      rawMetrics[`${key}_source`] = "defaulted";
      subScoreColumns[columnMap[key]] = null;
    } else {
      signalCoverage++;
      rawMetrics[`${key}_source`] = "computed";
      subScoreColumns[columnMap[key]] = sub.score;
    }
  }

  return { signalCoverage, rawMetrics, subScoreColumns };
}

export async function computeScoringCacheFields(sym: string, fetchFailed: boolean): Promise<{
  rankingCompanyName: string;
  signalScore: number | null;
  signalCoverage: number;
  rawMetrics: Record<string, unknown>;
  subScoreColumns: Record<string, number | null>;
}> {
  const { rankStockFromMarketData } = await import("@/lib/ranking");
  const ranking = await rankStockFromMarketData(sym);
  const built = buildCacheMetricsFromRanking(ranking);
  return {
    rankingCompanyName: ranking.companyName ?? sym,
    signalScore: fetchFailed || !ranking.scoreAvailable ? null : ranking.signalScore,
    signalCoverage: built.signalCoverage,
    rawMetrics: built.rawMetrics,
    subScoreColumns: built.subScoreColumns,
  };
}

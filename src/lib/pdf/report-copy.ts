import type { StockRankingResult, SubScoreKey } from "@/lib/ranking";

const SIGNAL_LABELS: Record<SubScoreKey, string> = {
  institutional: "Institutional 13F Data",
  insider: "Insider Buying vs Selling",
  pe: "PE Ratio Analysis",
  famousInvestor: "Famous Investor Portfolio Tracking",
  support: "52-Week Support Level",
  correlation: "Gold Price Correlation",
  fcfYield: "Free Cash Flow Yield",
};

/**
 * One-line portfolio summary based on average SignalScore.
 */
export function portfolioSummarySentence(averageScore: number): string {
  if (averageScore >= 80) {
    return "Your portfolio shows strong conviction across most holdings.";
  }
  if (averageScore >= 65) {
    return "Your portfolio shows a mix of strong and moderate conviction names.";
  }
  if (averageScore >= 50) {
    return "Your portfolio has mixed signals — some holdings warrant closer review.";
  }
  return "Several holdings are sending warning signals that deserve attention.";
}

/**
 * Returns the highest- and lowest-scoring stocks with short reasons.
 */
export function topPickAndWatchOut(rankings: StockRankingResult[]): {
  top: { ticker: string; score: number; reason: string } | null;
  bottom: { ticker: string; score: number; reason: string } | null;
} {
  if (rankings.length === 0) return { top: null, bottom: null };

  const sorted = [...rankings].sort((a, b) => b.signalScore - a.signalScore);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  const bestSub = Object.values(top.subScores).sort((a, b) => b.score - a.score)[0];
  const worstSub = Object.values(bottom.subScores).sort((a, b) => a.score - b.score)[0];

  return {
    top: {
      ticker: top.ticker,
      score: top.signalScore,
      reason: bestSub?.note ?? "Strong overall signal alignment",
    },
    bottom: {
      ticker: bottom.ticker,
      score: bottom.signalScore,
      reason: worstSub?.note ?? "Weakest overall signal alignment",
    },
  };
}

/**
 * Human-readable label for a sub-score row in the PDF.
 */
export function subScoreLabel(key: SubScoreKey): string {
  return SIGNAL_LABELS[key];
}

/**
 * Uses the ranking engine note as the PDF one-line explanation.
 */
export function subScoreExplanation(result: StockRankingResult, key: SubScoreKey): string {
  return result.subScores[key].note;
}

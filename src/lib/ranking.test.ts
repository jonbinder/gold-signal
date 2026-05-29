import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NEUTRAL_SCORE,
  SECTOR_PE_MEDIAN,
  SIGNAL_COUNT,
  aggregateInsiderNetDollars,
  calculatePortfolioScore,
  computeReturnCorrelation,
  computeEffectiveWeights,
  computeSignalScore,
  computeWeightedSignalScore,
  confidenceTierFromCoverage,
  countSignalCoverage,
  coveragePercentFromCount,
  letterGradeFromScore,
  rankStock,
  scoreCorrelation,
  scoreFamousInvestor,
  scoreFcfYield,
  scoreFromBands,
  scoreInstitutional,
  scoreInsider,
  scorePe,
  scoreSupport,
  type RankingInputs,
  type SubScoreKey,
} from "./ranking";
import type { DailyBar, InsiderTransaction } from "./polygon";

function baseInputs(overrides: Partial<RankingInputs> = {}): RankingInputs {
  return {
    ticker: "NEM",
    companyName: "Newmont Corporation",
    institutional: { ownershipPercent: 45, previousOwnershipPercent: 40 },
    insider: { netDollarValue90d: 1_500_000 },
    pe: { trailingPe: 12, sectorMedianPe: SECTOR_PE_MEDIAN },
    famousInvestor: { holderCount: 3 },
    support: { currentPrice: 40, fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 30 },
    correlation: { correlation180d: 0.75 },
    fcfYield: { fcfYieldPercent: 8 },
    ...overrides,
  };
}

describe("scoreFromBands", () => {
  it("returns mid-band score for low values", () => {
    const score = scoreFromBands(0.5, [
      { upTo: 1, scoreMin: 80, scoreMax: 100 },
      { upTo: Infinity, scoreMin: 0, scoreMax: 20 },
    ]);
    assert.equal(score, 90);
  });
});

describe("scoreInstitutional", () => {
  it("scores high when ownership is rising above 40%", () => {
    const r = scoreInstitutional({ ownershipPercent: 45, previousOwnershipPercent: 38 });
    assert.ok(r.score != null && r.score >= 80 && r.score <= 100);
    assert.equal(r.availability, "AVAILABLE");
  });

  it("scores mid when rising in 20-40% band", () => {
    const r = scoreInstitutional({ ownershipPercent: 30, previousOwnershipPercent: 25 });
    assert.ok(r.score != null && r.score >= 65 && r.score <= 79);
  });

  it("scores neutral-mid when flat", () => {
    const r = scoreInstitutional({ ownershipPercent: 35, previousOwnershipPercent: 35 });
    assert.ok(r.score != null && r.score >= 45 && r.score <= 64);
  });

  it("scores low when decreasing", () => {
    const r = scoreInstitutional({ ownershipPercent: 28, previousOwnershipPercent: 31 });
    assert.ok(r.score != null && r.score >= 20 && r.score <= 44);
  });

  it("scores very low when strongly decreasing", () => {
    const r = scoreInstitutional({ ownershipPercent: 15, previousOwnershipPercent: 28 });
    assert.ok(r.score != null && r.score >= 0 && r.score <= 19);
  });

  it("returns unavailable when data missing", () => {
    const r = scoreInstitutional(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
    assert.equal(r.missing, true);
  });
});

describe("scoreInsider", () => {
  it("scores high for net buying above $1M", () => {
    const r = scoreInsider({ netDollarValue90d: 2_000_000 });
    assert.ok(r.score != null && r.score >= 85 && r.score <= 100);
  });

  it("scores mid-high for $100K-$1M net buying", () => {
    const r = scoreInsider({ netDollarValue90d: 500_000 });
    assert.ok(r.score != null && r.score >= 70 && r.score <= 84);
  });

  it("scores mid for small net buying or flat", () => {
    const r = scoreInsider({ netDollarValue90d: 10_000 });
    assert.ok(r.score != null && r.score >= 50 && r.score <= 69);
  });

  it("scores low-mid for modest net selling", () => {
    const r = scoreInsider({ netDollarValue90d: -200_000 });
    assert.ok(r.score != null && r.score >= 30 && r.score <= 49);
  });

  it("scores very low for large net selling", () => {
    const r = scoreInsider({ netDollarValue90d: -2_000_000 });
    assert.ok(r.score != null && r.score >= 0 && r.score <= 29);
  });

  it("returns unavailable when missing", () => {
    const r = scoreInsider(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
  });
});

describe("scorePe", () => {
  it("scores high when PE is well below sector median", () => {
    const r = scorePe({ trailingPe: 10, sectorMedianPe: 18 });
    assert.ok(r.score != null && r.score >= 85 && r.score <= 100);
  });

  it("scores mid when PE is near median", () => {
    const r = scorePe({ trailingPe: 18, sectorMedianPe: 18 });
    assert.ok(r.score != null && r.score >= 45 && r.score <= 64);
  });

  it("scores low when PE is far above median", () => {
    const r = scorePe({ trailingPe: 30, sectorMedianPe: 18 });
    assert.ok(r.score != null && r.score >= 0 && r.score <= 44);
  });

  it("scores very low for negative earnings", () => {
    const r = scorePe({ trailingPe: -5, sectorMedianPe: 18 });
    assert.equal(r.score, 12);
    assert.equal(r.availability, "AVAILABLE");
  });

  it("returns unavailable when PE is null", () => {
    const r = scorePe(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
  });
});

describe("scoreFamousInvestor", () => {
  it("scores highest for 4+ holders", () => {
    const r = scoreFamousInvestor({ holderCount: 5 });
    assert.ok(r.score != null && r.score >= 85 && r.score <= 100);
  });

  it("scores mid-high for 2-3 holders", () => {
    const r = scoreFamousInvestor({ holderCount: 2 });
    assert.ok(r.score != null && r.score >= 70 && r.score <= 84);
  });

  it("scores mid for 1 holder", () => {
    const r = scoreFamousInvestor({ holderCount: 1 });
    assert.ok(r.score != null && r.score >= 50 && r.score <= 69);
  });

  it("scores neutral-low for zero holders when table has data", () => {
    const r = scoreFamousInvestor({ holderCount: 0 });
    assert.equal(r.score, 40);
    assert.equal(r.availability, "AVAILABLE");
  });

  it("returns unavailable when input is null", () => {
    const r = scoreFamousInvestor(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
  });
});

describe("scoreSupport", () => {
  it("scores high near 52-week low (support zone)", () => {
    const r = scoreSupport({ currentPrice: 31, fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 30 });
    assert.ok(r.score != null && r.score >= 70 && r.score <= 100);
  });

  it("scores high in recovery band (15-30% off low)", () => {
    const r = scoreSupport({ currentPrice: 35, fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 30 });
    assert.ok(r.score != null && r.score >= 70 && r.score <= 100);
  });

  it("scores mid in middle of range", () => {
    const r = scoreSupport({ currentPrice: 40, fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 30 });
    assert.ok(r.score != null && r.score >= 45 && r.score <= 69);
  });

  it("scores lower near 52-week high", () => {
    const r = scoreSupport({ currentPrice: 48, fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 30 });
    assert.ok(r.score != null && r.score >= 20 && r.score <= 49);
  });
});

describe("scoreCorrelation", () => {
  it("scores high for strong gold correlation", () => {
    const r = scoreCorrelation({ correlation180d: 0.85 });
    assert.ok(r.score != null && r.score >= 85 && r.score <= 100);
  });

  it("scores mid for moderate correlation", () => {
    const r = scoreCorrelation({ correlation180d: 0.45 });
    assert.ok(r.score != null && r.score >= 45 && r.score <= 69);
  });

  it("scores low for weak correlation", () => {
    const r = scoreCorrelation({ correlation180d: 0.05 });
    assert.ok(r.score != null && r.score >= 0 && r.score <= 29);
  });
});

describe("scoreFcfYield", () => {
  it("scores high above 10% yield", () => {
    const s = scoreFcfYield({ fcfYieldPercent: 12 }).score;
    assert.ok(s != null && s >= 85 && s <= 100);
  });

  it("scores mid for 2-5% yield", () => {
    const s = scoreFcfYield({ fcfYieldPercent: 3 }).score;
    assert.ok(s != null && s >= 50 && s <= 69);
  });

  it("scores low for negative FCF", () => {
    assert.ok(scoreFcfYield({ fcfYieldPercent: -2 }).score != null);
    assert.ok((scoreFcfYield({ fcfYieldPercent: -2 }).score ?? 100) <= 29);
  });
});

describe("coverage and confidence", () => {
  it("computes coverage percent from available count", () => {
    assert.equal(coveragePercentFromCount(0), 0);
    assert.equal(coveragePercentFromCount(2), 29);
    assert.equal(coveragePercentFromCount(7), 100);
  });

  it("maps confidence tiers", () => {
    assert.equal(confidenceTierFromCoverage(7), "high");
    assert.equal(confidenceTierFromCoverage(6), "high");
    assert.equal(confidenceTierFromCoverage(5), "medium");
    assert.equal(confidenceTierFromCoverage(4), "medium");
    assert.equal(confidenceTierFromCoverage(3), "low");
    assert.equal(confidenceTierFromCoverage(1), "low");
    assert.equal(confidenceTierFromCoverage(0), "none");
  });
});

describe("rankStock and portfolio", () => {
  it("produces composite score between 0 and 100", () => {
    const result = rankStock(baseInputs());
    assert.ok(result.signalScore >= 0 && result.signalScore <= 100);
    assert.equal(result.ticker, "NEM");
    assert.equal(result.signalCoverage, SIGNAL_COUNT);
    assert.equal(result.coveragePercent, 100);
    assert.equal(result.confidenceTier, "high");
    const keys: SubScoreKey[] = [
      "institutional",
      "insider",
      "pe",
      "famousInvestor",
      "support",
      "correlation",
      "fcfYield",
    ];
    for (const key of keys) {
      assert.ok(result.subScores[key].score != null);
      assert.ok(result.subScores[key].score! >= 0 && result.subScores[key].score! <= 100);
    }
  });

  it("uses neutral 50 when every signal is unavailable", () => {
    const result = rankStock({
      ticker: "XYZ",
      institutional: null,
      insider: null,
      pe: null,
      famousInvestor: null,
      support: null,
      correlation: null,
      fcfYield: null,
    });
    assert.equal(result.signalScore, NEUTRAL_SCORE);
    assert.equal(result.signalCoverage, 0);
    assert.equal(result.coveragePercent, 0);
    assert.equal(result.confidenceTier, "none");
    assert.ok(Object.values(result.subScores).every((s) => s.availability === "UNAVAILABLE"));
    assert.ok(Object.values(result.subScores).every((s) => s.score === null));
  });

  it("stores availability and scoring metadata in raw_metrics", () => {
    const result = rankStock(baseInputs({ correlation: null, pe: null }));
    assert.equal(result.rawMetrics.scoringVersion, 2);
    assert.equal(result.signalCoverage, 5);
    assert.equal(result.coveragePercent, 71);
    assert.equal(result.confidenceTier, "medium");
    const availability = result.rawMetrics.signalAvailability as Record<string, string>;
    assert.equal(availability.correlation, "UNAVAILABLE");
    assert.equal(availability.institutional, "AVAILABLE");
    const subScores = result.rawMetrics.subScores as Record<string, { score: number | null }>;
    assert.equal(subScores.correlation.score, null);
    assert.equal(subScores.pe.score, null);
  });

  it("computeSignalScore matches dynamic re-weighting helper", () => {
    const result = rankStock(baseInputs());
    assert.equal(result.signalScore, computeSignalScore(result.subScores));
  });

  it("calculatePortfolioScore averages corrected per-stock scores", () => {
    const sparse = rankStock({
      ticker: "AEM",
      correlation: { correlation180d: 0.93 },
      famousInvestor: { holderCount: 3 },
    });
    const full = rankStock(baseInputs());
    const p = calculatePortfolioScore([sparse, full]);
    assert.ok(sparse.signalScore >= 85);
    assert.ok(p.averageSignalScore > 50);
    assert.equal(p.stockCount, 2);
  });

  it("letterGradeFromScore maps tiers", () => {
    assert.equal(letterGradeFromScore(92), "A+");
    assert.equal(letterGradeFromScore(86), "A");
    assert.equal(letterGradeFromScore(42), "D");
    assert.equal(letterGradeFromScore(30), "F");
  });
});

describe("computeWeightedSignalScore", () => {
  it("returns 50 when no real signals exist", () => {
    const score = computeWeightedSignalScore([
      { score: 50, weight: 0.15, defaulted: true },
      { score: 50, weight: 0.2, defaulted: true },
    ]);
    assert.equal(score, NEUTRAL_SCORE);
  });

  it("uses only the real signal when one is available", () => {
    const score = computeWeightedSignalScore([
      { score: 93, weight: 0.1, defaulted: false },
      { score: 50, weight: 0.15, defaulted: true },
      { score: 50, weight: 0.2, defaulted: true },
    ]);
    assert.equal(score, 93);
  });

  it("renormalizes weights across multiple real signals", () => {
    const score = computeWeightedSignalScore([
      { score: 93, weight: 0.1, defaulted: false },
      { score: 82, weight: 0.2, defaulted: false },
      { score: 50, weight: 0.15, defaulted: true },
      { score: 50, weight: 0.1, defaulted: true },
      { score: 50, weight: 0.15, defaulted: true },
    ]);
    const expected = Math.round((93 * 0.1 + 82 * 0.2) / (0.1 + 0.2));
    assert.equal(score, expected);
    assert.ok(score >= 85);
  });

  it("does not drag high real scores toward 50 when five signals are unavailable", () => {
    const result = rankStock({
      ticker: "AEM",
      correlation: { correlation180d: 0.93 },
      famousInvestor: { holderCount: 3 },
      institutional: null,
      insider: null,
      pe: null,
      support: null,
      fcfYield: null,
    });
    assert.equal(result.signalCoverage, 2);
    assert.equal(result.confidenceTier, "low");
    assert.ok(result.signalScore >= 85, `expected high score, got ${result.signalScore}`);
    assert.equal(result.subScores.correlation.score, 93);
    assert.equal(result.subScores.institutional.score, null);
  });

  it("exposes effective weights that sum to 1 for real signals only", () => {
    const result = rankStock({
      ticker: "TEST",
      correlation: { correlation180d: 0.8 },
      pe: { trailingPe: 12, sectorMedianPe: SECTOR_PE_MEDIAN },
      institutional: null,
      insider: null,
      famousInvestor: null,
      support: null,
      fcfYield: null,
    });
    const effective = computeEffectiveWeights(result.subScores);
    const sum = Object.values(effective).reduce((a, b) => a + (b ?? 0), 0);
    assert.ok(Math.abs(sum - 1) < 0.001);
    assert.equal(countSignalCoverage(result.subScores), 2);
  });
});

describe("computeReturnCorrelation", () => {
  it("returns ~1 for perfectly correlated series", () => {
    const bars: DailyBar[] = [];
    for (let i = 0; i < 60; i++) {
      const close = 100 + i;
      bars.push({
        date: `2024-01-${String(i + 1).padStart(2, "0")}`,
        open: close,
        high: close,
        low: close,
        close,
        volume: 1,
      });
    }
    const corr = computeReturnCorrelation(bars, bars);
    assert.ok(corr != null && corr > 0.99);
  });

  it("returns null with insufficient overlap", () => {
    assert.equal(computeReturnCorrelation([], []), null);
  });
});

describe("aggregateInsiderNetDollars", () => {
  it("sums buys minus sells from Polygon rows", () => {
    const rows: InsiderTransaction[] = [
      {
        filingDate: "2026-04-15",
        transactionDate: "2026-04-14",
        ownerName: "CEO",
        transactionCode: "P",
        acquiredDisposed: "A",
        shares: 10000,
        pricePerShare: 50,
        value: 500_000,
        officerTitle: "CEO",
      },
      {
        filingDate: "2026-04-20",
        transactionDate: "2026-04-18",
        ownerName: "CFO",
        transactionCode: "S",
        acquiredDisposed: "D",
        shares: 2000,
        pricePerShare: 48,
        value: 96_000,
        officerTitle: "CFO",
      },
    ];
    const { netDollarValue90d } = aggregateInsiderNetDollars(rows, null);
    assert.equal(netDollarValue90d, 404_000);
  });

  it("skips routine option exercise codes", () => {
    const rows: InsiderTransaction[] = [
      {
        filingDate: "2026-04-10",
        transactionDate: "2026-04-09",
        ownerName: "Exec",
        transactionCode: "M",
        acquiredDisposed: "A",
        shares: 50000,
        pricePerShare: 0,
        value: 0,
        officerTitle: null,
      },
    ];
    const { netDollarValue90d } = aggregateInsiderNetDollars(rows, null);
    assert.equal(netDollarValue90d, null);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FOOTPRINT_COUNT,
  FOOTPRINT_WEIGHTS,
  SECTOR_PE_MEDIAN,
  aggregateInsiderNetDollars,
  calculatePortfolioScore,
  computeEffectiveWeights,
  computeFinalScore,
  computeReturnCorrelation,
  computeSmartMoneyBase,
  computeWeightedSignalScore,
  confidenceTierFromCoverage,
  countSignalCoverage,
  coveragePercentFromCount,
  letterGradeFromScore,
  rankStock,
  scoreFamousInvestor,
  scoreFromBands,
  scoreInstitutional,
  scoreInsider,
  scorePe,
  type RankingInputs,
} from "./ranking";
import type { DailyBar, InsiderTransaction } from "./polygon";
import type { TorqueInputs } from "./torque";

function baseTorque(overrides: Partial<TorqueInputs> = {}): TorqueInputs {
  return {
    beta: 1,
    rSquared: 0.5,
    universeMedianBeta: 1,
    universeMinBeta: 0.6,
    universeMaxBeta: 1.4,
    universeValidBetaCount: 20,
    metalProxy: "GLD",
    ...overrides,
  };
}

function footprintInputs(overrides: Partial<RankingInputs> = {}): RankingInputs {
  return {
    ticker: "NEM",
    companyName: "Newmont Corporation",
    institutional: { ownershipPercent: 45, previousOwnershipPercent: 40 },
    insider: { netDollarValue90d: 1_500_000 },
    famousInvestor: { holderCount: 3 },
    pe: null,
    support: null,
    correlation: null,
    fcfYield: null,
    torque: baseTorque(),
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
  it("returns unavailable when data missing", () => {
    const r = scoreInstitutional(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
  });
});

describe("scoreInsider", () => {
  it("returns unavailable when missing", () => {
    const r = scoreInsider(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
  });
});

describe("scorePe", () => {
  it("still computes dormant context scores", () => {
    const r = scorePe({ trailingPe: 10, sectorMedianPe: SECTOR_PE_MEDIAN });
    assert.ok(r.score != null);
    assert.equal(r.availability, "AVAILABLE");
  });
});

describe("scoreFamousInvestor", () => {
  it("returns unavailable when input is null", () => {
    const r = scoreFamousInvestor(null);
    assert.equal(r.score, null);
    assert.equal(r.availability, "UNAVAILABLE");
  });
});

describe("coverage and confidence (v3 footprints)", () => {
  it("computes coverage percent from footprint count", () => {
    assert.equal(coveragePercentFromCount(0), 0);
    assert.equal(coveragePercentFromCount(1), 33);
    assert.equal(coveragePercentFromCount(3), 100);
  });

  it("maps confidence tiers for three footprints", () => {
    assert.equal(confidenceTierFromCoverage(3), "high");
    assert.equal(confidenceTierFromCoverage(2), "medium");
    assert.equal(confidenceTierFromCoverage(1), "low");
    assert.equal(confidenceTierFromCoverage(0), "none");
  });
});

describe("computeSmartMoneyBase", () => {
  it("renormalizes when only insider is available", () => {
    const result = rankStock(
      footprintInputs({
        institutional: null,
        famousInvestor: null,
        insider: { netDollarValue90d: 2_000_000 },
      }),
    );
    assert.ok(result.smartMoneyBase != null && result.smartMoneyBase >= 85);
    assert.equal(result.signalCoverage, 1);
  });

  it("renormalizes two footprints at 60/40 insider/institutional", () => {
    const result = rankStock(
      footprintInputs({
        famousInvestor: null,
        insider: { netDollarValue90d: 2_000_000 },
        institutional: { ownershipPercent: 45, previousOwnershipPercent: 38 },
      }),
    );
    const effective = computeEffectiveWeights(result.subScores);
    assert.ok(Math.abs((effective.insider ?? 0) - 0.6) < 0.001);
    assert.ok(Math.abs((effective.institutional ?? 0) - 0.4) < 0.001);
    assert.equal(result.signalCoverage, 2);
  });

  it("uses full 45/30/25 when all three footprints are available", () => {
    const result = rankStock(footprintInputs());
    const effective = computeEffectiveWeights(result.subScores);
    assert.ok(Math.abs((effective.insider ?? 0) - FOOTPRINT_WEIGHTS.insider) < 0.001);
    assert.ok(Math.abs((effective.institutional ?? 0) - FOOTPRINT_WEIGHTS.institutional) < 0.001);
    assert.ok(Math.abs((effective.famousInvestor ?? 0) - FOOTPRINT_WEIGHTS.famousInvestor) < 0.001);
    assert.equal(result.signalCoverage, FOOTPRINT_COUNT);
  });
});

describe("computeFinalScore", () => {
  it("returns null scores when smart money base is unavailable", () => {
    const final = computeFinalScore(null, 1.1);
    assert.equal(final.scoreAvailable, false);
    assert.equal(final.signalScore, null);
    assert.equal(final.signalScoreRaw, null);
  });

  it("stores raw above display when torque pushes past 100", () => {
    const final = computeFinalScore(95, 1.15);
    assert.equal(final.signalScoreRaw, 95 * 1.15);
    assert.equal(final.signalScore, 100);
    assert.equal(final.scoreAvailable, true);
  });
});

describe("rankStock v3 model", () => {
  it("produces display score between 0 and 100 when footprints exist", () => {
    const result = rankStock(footprintInputs());
    assert.ok(result.scoreAvailable);
    assert.ok(result.signalScore != null && result.signalScore >= 0 && result.signalScore <= 100);
    assert.equal(result.rawMetrics.scoringVersion, 3);
    assert.equal(result.coveragePercent, 100);
    assert.equal(result.confidenceTier, "high");
  });

  it("does not fabricate a score when zero footprints are available", () => {
    const result = rankStock({
      ticker: "XYZ",
      institutional: null,
      insider: null,
      famousInvestor: null,
      pe: { trailingPe: 12, sectorMedianPe: SECTOR_PE_MEDIAN },
      support: { currentPrice: 40, fiftyTwoWeekHigh: 50, fiftyTwoWeekLow: 30 },
      correlation: { correlation180d: 0.8 },
      fcfYield: { fcfYieldPercent: 5 },
      torque: baseTorque(),
    });
    assert.equal(result.scoreAvailable, false);
    assert.equal(result.signalScore, null);
    assert.equal(result.signalScoreRaw, null);
    assert.equal(result.smartMoneyBase, null);
    assert.equal(result.signalCoverage, 0);
    assert.equal(result.confidenceTier, "none");
    assert.equal(result.torqueMultiplier, 1);
  });

  it("applies gentle torque without zeroing strong smart-money names", () => {
    const strongLowTorque = rankStock(
      footprintInputs({
        torque: baseTorque({ beta: 0.6, rSquared: 0.5 }),
      }),
    );
    const strongHighTorque = rankStock(
      footprintInputs({
        torque: baseTorque({ beta: 1.4, rSquared: 0.5 }),
      }),
    );
    assert.ok(strongLowTorque.scoreAvailable);
    assert.ok(strongHighTorque.scoreAvailable);
    assert.ok((strongHighTorque.signalScoreRaw ?? 0) > (strongLowTorque.signalScoreRaw ?? 0));
    assert.ok((strongLowTorque.signalScore ?? 0) >= 70);
  });

  it("records audit fields in raw_metrics", () => {
    const result = rankStock(footprintInputs({ torque: baseTorque({ beta: 1.2, rSquared: 0.4 }) }));
    assert.equal(result.rawMetrics.smartMoneyBase, result.smartMoneyBase);
    assert.equal(result.rawMetrics.torqueMultiplier, result.torqueMultiplier);
    const detail = result.rawMetrics.torqueDetail as { beta: number; r2GateTriggered: boolean };
    assert.equal(detail.beta, 1.2);
    assert.equal(detail.r2GateTriggered, false);
  });

  it("keeps dormant context scores out of the composite", () => {
    const result = rankStock(
      footprintInputs({
        institutional: null,
        insider: null,
        famousInvestor: null,
        pe: { trailingPe: 8, sectorMedianPe: SECTOR_PE_MEDIAN },
      }),
    );
    assert.equal(result.scoreAvailable, false);
    assert.ok(result.subScores.pe.score != null);
  });

  it("calculatePortfolioScore excludes unscored stocks", () => {
    const scored = rankStock(footprintInputs());
    const unscored = rankStock({
      ticker: "EMPTY",
      institutional: null,
      insider: null,
      famousInvestor: null,
    });
    const portfolio = calculatePortfolioScore([scored, unscored]);
    assert.equal(portfolio.stockCount, 1);
    assert.equal(portfolio.averageSignalScore, scored.signalScore);
  });
});

describe("computeWeightedSignalScore", () => {
  it("returns null when no real signals exist", () => {
    const score = computeWeightedSignalScore([
      { score: 50, weight: 0.15, defaulted: true },
      { score: 50, weight: 0.2, defaulted: true },
    ]);
    assert.equal(score, null);
  });

  it("uses only the real signal when one is available", () => {
    const score = computeWeightedSignalScore([
      { score: 93, weight: 0.45, defaulted: false },
      { score: 50, weight: 0.3, defaulted: true },
    ]);
    assert.equal(score, 93);
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
    ];
    const { netDollarValue90d } = aggregateInsiderNetDollars(rows, null);
    assert.equal(netDollarValue90d, 500_000);
  });
});

describe("letterGradeFromScore", () => {
  it("maps tiers", () => {
    assert.equal(letterGradeFromScore(92), "A+");
    assert.equal(letterGradeFromScore(42), "D");
  });
});

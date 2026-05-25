import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NEUTRAL_SCORE,
  SECTOR_PE_MEDIAN,
  aggregateInsiderNetDollars,
  calculatePortfolioScore,
  computeReturnCorrelation,
  computeSignalScore,
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
    assert.ok(r.score >= 80 && r.score <= 100);
    assert.equal(r.missing, false);
  });

  it("scores mid when rising in 20-40% band", () => {
    const r = scoreInstitutional({ ownershipPercent: 30, previousOwnershipPercent: 25 });
    assert.ok(r.score >= 65 && r.score <= 79);
  });

  it("scores neutral-mid when flat", () => {
    const r = scoreInstitutional({ ownershipPercent: 35, previousOwnershipPercent: 35 });
    assert.ok(r.score >= 45 && r.score <= 64);
  });

  it("scores low when decreasing", () => {
    const r = scoreInstitutional({ ownershipPercent: 28, previousOwnershipPercent: 31 });
    assert.ok(r.score >= 20 && r.score <= 44);
  });

  it("scores very low when strongly decreasing", () => {
    const r = scoreInstitutional({ ownershipPercent: 15, previousOwnershipPercent: 28 });
    assert.ok(r.score >= 0 && r.score <= 19);
  });

  it("returns neutral when data missing", () => {
    const r = scoreInstitutional(null);
    assert.equal(r.score, NEUTRAL_SCORE);
    assert.equal(r.missing, true);
  });
});

describe("scoreInsider", () => {
  it("scores high for net buying above $1M", () => {
    const r = scoreInsider({ netDollarValue90d: 2_000_000 });
    assert.ok(r.score >= 85 && r.score <= 100);
  });

  it("scores mid-high for $100K-$1M net buying", () => {
    const r = scoreInsider({ netDollarValue90d: 500_000 });
    assert.ok(r.score >= 70 && r.score <= 84);
  });

  it("scores mid for small net buying or flat", () => {
    const r = scoreInsider({ netDollarValue90d: 10_000 });
    assert.ok(r.score >= 50 && r.score <= 69);
  });

  it("scores low-mid for modest net selling", () => {
    const r = scoreInsider({ netDollarValue90d: -200_000 });
    assert.ok(r.score >= 30 && r.score <= 49);
  });

  it("scores very low for large net selling", () => {
    const r = scoreInsider({ netDollarValue90d: -2_000_000 });
    assert.ok(r.score >= 0 && r.score <= 29);
  });

  it("returns neutral when missing", () => {
    assert.equal(scoreInsider(null).score, NEUTRAL_SCORE);
  });
});

describe("scorePe", () => {
  it("scores high when PE is well below sector median", () => {
    const r = scorePe({ trailingPe: 10, sectorMedianPe: 18 });
    assert.ok(r.score >= 85 && r.score <= 100);
  });

  it("scores mid when PE is near median", () => {
    const r = scorePe({ trailingPe: 18, sectorMedianPe: 18 });
    assert.ok(r.score >= 45 && r.score <= 64);
  });

  it("scores low when PE is far above median", () => {
    const r = scorePe({ trailingPe: 30, sectorMedianPe: 18 });
    assert.ok(r.score >= 0 && r.score <= 24);
  });

  it("scores very low for negative earnings", () => {
    const r = scorePe({ trailingPe: -5 });
    assert.ok(r.score >= 0 && r.score <= 24);
    assert.equal(r.missing, false);
  });
});

describe("scoreFamousInvestor", () => {
  it("scores highest for 4+ holders", () => {
    assert.ok(scoreFamousInvestor({ holderCount: 5 }).score >= 90);
  });

  it("scores mid-high for 2-3 holders", () => {
    const s = scoreFamousInvestor({ holderCount: 2 }).score;
    assert.ok(s >= 75 && s <= 89);
  });

  it("scores mid for 1 holder", () => {
    const s = scoreFamousInvestor({ holderCount: 1 }).score;
    assert.ok(s >= 60 && s <= 74);
  });

  it("scores neutral-low for zero holders (not zero)", () => {
    const s = scoreFamousInvestor({ holderCount: 0 }).score;
    assert.ok(s >= 30 && s <= 50);
  });
});

describe("scoreSupport", () => {
  it("scores high near 52-week low (support zone)", () => {
    const r = scoreSupport({ currentPrice: 31, fiftyTwoWeekLow: 30, fiftyTwoWeekHigh: 50 });
    assert.ok(r.score >= 75 && r.score <= 90);
  });

  it("scores high in recovery band (15-30% off low)", () => {
    const r = scoreSupport({ currentPrice: 36, fiftyTwoWeekLow: 30, fiftyTwoWeekHigh: 50 });
    assert.ok(r.score >= 80 && r.score <= 95);
  });

  it("scores mid in middle of range", () => {
    const r = scoreSupport({ currentPrice: 40, fiftyTwoWeekLow: 30, fiftyTwoWeekHigh: 50 });
    assert.ok(r.score >= 50 && r.score <= 65);
  });

  it("scores lower near 52-week high", () => {
    const r = scoreSupport({ currentPrice: 49, fiftyTwoWeekLow: 30, fiftyTwoWeekHigh: 50 });
    assert.ok(r.score >= 25 && r.score <= 40);
  });
});

describe("scoreCorrelation", () => {
  it("scores high for strong gold correlation", () => {
    assert.ok(scoreCorrelation({ correlation180d: 0.8 }).score >= 85);
  });

  it("scores mid for moderate correlation", () => {
    const s = scoreCorrelation({ correlation180d: 0.4 }).score;
    assert.ok(s >= 50 && s <= 69);
  });

  it("scores low for weak correlation", () => {
    assert.ok(scoreCorrelation({ correlation180d: 0.05 }).score <= 29);
  });
});

describe("scoreFcfYield", () => {
  it("scores high above 10% yield", () => {
    assert.ok(scoreFcfYield({ fcfYieldPercent: 12 }).score >= 85);
  });

  it("scores mid for 2-5% yield", () => {
    const s = scoreFcfYield({ fcfYieldPercent: 3 }).score;
    assert.ok(s >= 50 && s <= 69);
  });

  it("scores low for negative FCF", () => {
    assert.ok(scoreFcfYield({ fcfYieldPercent: -2 }).score <= 29);
  });
});

describe("rankStock and portfolio", () => {
  it("produces composite score between 0 and 100", () => {
    const result = rankStock(baseInputs());
    assert.ok(result.signalScore >= 0 && result.signalScore <= 100);
    assert.equal(result.ticker, "NEM");
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
      assert.ok(result.subScores[key].score >= 0 && result.subScores[key].score <= 100);
    }
  });

  it("uses neutral 50 for missing signals without failing", () => {
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
    assert.ok(Object.values(result.subScores).every((s) => s.missing));
  });

  it("computeSignalScore matches weighted sum", () => {
    const result = rankStock(baseInputs());
    assert.equal(result.signalScore, computeSignalScore(result.subScores));
  });

  it("calculatePortfolioScore averages and assigns grade", () => {
    const p = calculatePortfolioScore([{ signalScore: 88 }, { signalScore: 72 }]);
    assert.equal(p.averageSignalScore, 80);
    assert.equal(p.letterGrade, "A-");
    assert.equal(p.stockCount, 2);
  });

  it("letterGradeFromScore maps tiers", () => {
    assert.equal(letterGradeFromScore(92), "A+");
    assert.equal(letterGradeFromScore(86), "A");
    assert.equal(letterGradeFromScore(42), "D");
    assert.equal(letterGradeFromScore(30), "F");
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

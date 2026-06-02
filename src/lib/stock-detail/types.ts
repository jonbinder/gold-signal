import type { StockFactsModel } from "@/lib/stock-facts";
import type { StockDetailChartsModel } from "@/lib/stock-detail/chart-data";

export type TrackedFundHolder = {
  slug: string;
  name: string;
  portfolioPct: number | null;
  changeType: string | null;
  valueUsd: number | null;
};

export type TrackedInvestorRef = {
  slug: string;
  name: string;
  type: "individual" | "fund";
};

export type LargeStakeRow = {
  kind: "stake_13d" | "stake_13g";
  filerName: string;
  ownershipPct: number;
  filingDate: string;
  filingDateLabel: string;
};

export type InstitutionalSummary = {
  available: boolean;
  periodLabel: string | null;
  periodEnd: string | null;
  holderCount: number;
  netChangeSummary: string | null;
  newPositions: number;
  additions: number;
  reductions: number;
  exits: number;
};

export type StockDetailPageModel = StockFactsModel & {
  metalTag: string;
  institutional: InstitutionalSummary;
  fundHolders: TrackedFundHolder[];
  trackedInvestors: TrackedInvestorRef[];
  largeStakes: LargeStakeRow[];
  charts: StockDetailChartsModel;
  teachingKeys: {
    insider: string;
    institutional: string;
  };
};

import type { InsiderTransactionRow } from "@/lib/form4-insider";
import type { LargeStakeRow } from "@/lib/stock-detail/types";

export type TickerReadoutInstitutional = {
  available: boolean;
  holderCount: number;
  periodLabel: string | null;
  netChangeSummary: string | null;
  fundNames: string[];
  teachingKey: string;
};

export type TickerReadoutInsider = {
  available: boolean;
  net90dLabel: string;
  asOfLabel: string | null;
  transactions: InsiderTransactionRow[];
  teachingKey: string;
};

export type TickerReadout = {
  ticker: string;
  companyName: string;
  /** False when ticker is not in our tracked universe and we have no cache row. */
  onFile: boolean;
  marketCap: string | null;
  insider: TickerReadoutInsider;
  institutional: TickerReadoutInstitutional;
  largeStakes: LargeStakeRow[];
  stakeTeachingKey: "stake_13d_default" | "stake_13g_default";
  stockPageUrl: string;
};

export type ReadoutEmailPayload = {
  userName: string;
  tickers: TickerReadout[];
  skippedInvalidTickers: string[];
};

// Auto-generate the real version with: npm run db:generate
// This is the hand-written version for initial development

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Sector = "Gold Miner" | "Silver Miner" | "Royalty/Streaming" | "ETF";
export type ChangeType = "new" | "add" | "reduce" | "sell" | "unchanged";

export interface Investor {
  id: string;
  slug: string;
  name: string;
  firm: string | null;
  bio: string | null;
  aum_usd: number | null;
  focus: string[];
  website_url: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Security {
  id: string;
  ticker: string;
  exchange: string;
  name: string;
  sector: Sector | null;
  sub_sector: string | null;
  country: string | null;
  market_cap: number | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReportingPeriod {
  id: string;
  label: string;
  period_end: string;
  filing_due: string | null;
  is_latest: boolean;
  created_at: string;
}

export interface Holding {
  id: string;
  investor_id: string;
  security_id: string;
  period_id: string;
  shares: number;
  value_usd: number;
  portfolio_pct: number | null;
  shares_prev: number | null;
  value_prev_usd: number | null;
  change_type: ChangeType | null;
  change_pct: number | null;
  created_at: string;
}

export interface SecurityOwnershipStats {
  id: string;
  security_id: string;
  period_id: string;
  owner_count: number;
  total_shares: number;
  total_value_usd: number;
  new_buyers: number;
  sellers: number;
  updated_at: string;
}

// Joined / enriched types for UI
export interface HoldingWithSecurity extends Holding {
  security: Security;
}

export interface HoldingWithInvestor extends Holding {
  investor: Investor;
}

export interface LeaderboardEntry {
  security: Security;
  stats: SecurityOwnershipStats;
  price_change_pct?: number | null;
}

export interface InvestorWithHoldings extends Investor {
  holdings: HoldingWithSecurity[];
  period: ReportingPeriod;
}

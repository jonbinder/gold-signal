export type GoldSilverStockCategory =
  | "Gold Producer"
  | "Silver Producer"
  | "Junior Explorer"
  | "Royalty/Streaming"
  | "ETF";

export interface CuratedStock {
  id?: string;
  ticker: string;
  name: string;
  category: GoldSilverStockCategory;
  exchange: string;
  market_cap_usd: number | null;
  is_active: boolean;
  created_at?: string;
}

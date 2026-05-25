export type StockCategory =
  | "major_producer"
  | "mid_tier_producer"
  | "junior_producer"
  | "developer"
  | "royalty"
  | "etf";

export type StockSubCategory = "gold" | "silver" | "diversified";

export type TrackedStock = {
  ticker: string;
  name: string;
  category: StockCategory;
  sub_category: StockSubCategory;
  exchange: string;
  logo_url: string | null;
};

export type TrackedStocksFile = {
  generated_at: string;
  source_counts: Record<string, number>;
  stocks: TrackedStock[];
};

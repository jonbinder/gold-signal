const CATEGORY_LABELS: Record<string, string> = {
  major_producer: "Major producer",
  mid_tier_producer: "Mid-tier producer",
  junior_producer: "Junior producer",
  developer: "Developer",
  royalty: "Royalty & streaming",
  etf: "ETF",
};

const METAL_LABELS: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  diversified: "Diversified",
};

/** Human-readable sector line, e.g. "Gold royalty & streaming". */
export function formatStockSectorLabel(category: string, subCategory: string): string {
  const metal = METAL_LABELS[subCategory] ?? subCategory.replace(/_/g, " ");
  const kind = CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
  if (category === "etf") return kind;
  return `${metal} · ${kind}`;
}

export type MarketCapSize = "all" | "large" | "mid" | "small";

export function marketCapSize(marketCapBillions: number): Exclude<MarketCapSize, "all"> {
  if (marketCapBillions >= 10) return "large";
  if (marketCapBillions >= 1) return "mid";
  return "small";
}

export const MARKET_CAP_SIZE_OPTIONS: { value: MarketCapSize; label: string }[] = [
  { value: "all", label: "All sizes" },
  { value: "large", label: "Large cap ($10B+)" },
  { value: "mid", label: "Mid cap ($1B–$10B)" },
  { value: "small", label: "Small cap (<$1B)" },
];

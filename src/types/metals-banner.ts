/** One line in the header market strip (Polygon snapshot + Yahoo fallback). */
export type MarketBannerQuote = {
  price: number;
  /** Session / today's % change (e.g. 1.25 = +1.25%). */
  changePct: number | null;
};

export type MarketBannerPayload = {
  gold: MarketBannerQuote | null;
  silver: MarketBannerQuote | null;
  sp500: MarketBannerQuote | null;
  gdx: MarketBannerQuote | null;
  asOf: string;
};

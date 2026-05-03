export type MetalsBannerPayload = {
  gold: { price: number; changePct: number | null } | null;
  silver: { price: number; changePct: number | null } | null;
  /** Gold price ÷ silver price, rounded to nearest whole number. */
  ratio: number | null;
  asOf: string;
};

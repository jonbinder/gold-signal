/** Clearbit logo domains keyed by ticker */
export const STOCK_LOGO_DOMAINS: Record<string, string> = {
  ELE: "elementalroyalty.com",
  FNV: "franco-nevada.com",
  WPM: "wheatonpm.com",
  GOLD: "barrick.com",
  AEM: "agnicoeagle.com",
  KGC: "kinross.com",
  AG: "firstmajestic.com",
  PAAS: "panamericansilver.com",
  RGLD: "royalgold.com",
  GDX: "vaneck.com",
  HL: "hecla.com",
  MUX: "mcewenmining.com",
  NEM: "newmont.com",
};

export function stockLogoUrl(ticker: string): string {
  const domain = STOCK_LOGO_DOMAINS[ticker.toUpperCase()];
  return domain ? `https://logo.clearbit.com/${domain}` : "";
}

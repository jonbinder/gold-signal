import { normalizeTicker } from "@/lib/polygon";

type StockRoute = `/stocks/${string}`;
type FundRoute = `/funds/${string}`;
type InvestorRoute = `/investors/${string}`;

/** Canonical app path for a stock detail page (uppercase ticker, preserves suffixes like .V). */
export function stockPath(ticker: string): StockRoute {
  const sym = normalizeTicker(ticker);
  return `/stocks/${encodeURIComponent(sym)}` as StockRoute;
}

/** Canonical app path for a fund detail page. */
export function fundPath(slug: string): FundRoute {
  return `/funds/${encodeURIComponent(slug.trim())}` as FundRoute;
}

/** Canonical app path for an investor detail page. */
export function investorPath(slug: string): InvestorRoute {
  return `/investors/${encodeURIComponent(slug.trim())}` as InvestorRoute;
}

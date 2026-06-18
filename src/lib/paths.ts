import { normalizeTicker } from "@/lib/polygon";

type StockRoute = `/stocks/${string}`;
type FundRoute = `/funds/${string}`;
type PortfolioRoute = `/portfolios/${string}`;

/** Canonical app path for a stock detail page (uppercase ticker, preserves suffixes like .V). */
export function stockPath(ticker: string): StockRoute {
  const sym = normalizeTicker(ticker);
  return `/stocks/${encodeURIComponent(sym)}` as StockRoute;
}

/** Canonical app path for a fund detail page. */
export function fundPath(slug: string): FundRoute {
  return `/funds/${encodeURIComponent(slug.trim())}` as FundRoute;
}

/** Canonical app path for a portfolio detail page. */
export function portfolioPath(slug: string): PortfolioRoute {
  return `/portfolios/${encodeURIComponent(slug.trim())}` as PortfolioRoute;
}

/** @deprecated Use portfolioPath */
export const investorPath = portfolioPath;

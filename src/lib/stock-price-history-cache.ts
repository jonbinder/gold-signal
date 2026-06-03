import {
  compactPriceHistory12m,
  type CachedPricePoint,
} from "@/lib/charts/price-series";
import { getPriceHistory, normalizeTicker } from "@/lib/polygon";

/**
 * Fetches ~12 months of daily closes from Polygon for background cache refresh only.
 */
export async function fetchCompactPriceHistory12m(ticker: string): Promise<CachedPricePoint[] | null> {
  const sym = normalizeTicker(ticker);
  const history = await getPriceHistory(sym, 400);
  if (!history.ok || history.data.length === 0) return null;
  return compactPriceHistory12m(history.data, 12);
}

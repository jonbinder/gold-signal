import { getPriceHistory, normalizeTicker } from "@/lib/polygon";

/** (latestPrice − trailing 52w low) / low × 100, rounded to whole percent. */
export function pctAbove52WeekLowFromPrice(current: number, low52w: number): number | null {
  if (low52w <= 0 || current <= 0 || !Number.isFinite(current) || !Number.isFinite(low52w)) {
    return null;
  }
  return Math.round(((current - low52w) / low52w) * 100);
}

function trailing52WeekLow(bars: { low: number }[]): number | null {
  if (bars.length === 0) return null;
  let low = Infinity;
  for (const b of bars) {
    if (b.low > 0 && b.low < low) low = b.low;
  }
  return Number.isFinite(low) && low > 0 ? low : null;
}

/**
 * Computes % above 52-week low from Polygon daily bars (~400 calendar days).
 * For background refresh only — not for /stocks page render.
 */
export async function resolvePctAbove52WeekLow(
  ticker: string,
  currentPrice: number | null,
): Promise<number | null> {
  const sym = normalizeTicker(ticker);
  if (currentPrice == null || currentPrice <= 0) return null;

  const history = await getPriceHistory(sym, 400);
  if (!history.ok || history.data.length === 0) return null;

  const low = trailing52WeekLow(history.data);
  if (low == null) return null;

  return pctAbove52WeekLowFromPrice(currentPrice, low);
}

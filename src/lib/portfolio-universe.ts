import { cache } from "react";
import { normalizeTicker } from "@/lib/polygon";
import { getTrackedStocks, loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

/** Tickers in the curated universe (tracked-stocks.json). */
export const getTrackedTickerSymbols = cache(async (): Promise<string[]> => {
  const stocks = await getTrackedStocks();
  return stocks.map((s) => s.ticker).sort((a, b) => a.localeCompare(b));
});

export async function isTrackedTicker(ticker: string): Promise<boolean> {
  const sym = normalizeTicker(ticker);
  return loadTrackedStocksSync().some((s) => normalizeTicker(s.ticker) === sym);
}

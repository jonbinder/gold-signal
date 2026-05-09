import { cache } from "react";
import { getInvestors } from "@/lib/investors";

function normalizeTicker(t: string): string {
  return t.trim().toUpperCase().replace(/^US:/, "");
}

/** Every ticker held by at least one tracked investor (from investors-data.json). */
export const getTrackedTickerSymbols = cache(async (): Promise<string[]> => {
  const investors = await getInvestors();
  const set = new Set<string>();
  for (const inv of investors) {
    for (const row of inv.portfolio) {
      const sym = normalizeTicker(row.ticker);
      if (sym) set.add(sym);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
});

export async function isTrackedTicker(ticker: string): Promise<boolean> {
  const sym = normalizeTicker(ticker);
  const all = await getTrackedTickerSymbols();
  return all.includes(sym);
}

import { unstable_cache } from "next/cache";
import { getInvestors } from "@/lib/investors/csv-data";
import { isTrackedInvestorSlug, normalizeTrackedInvestorSlug } from "@/lib/investors/tracked-roster";
import { normalizeTicker } from "@/lib/polygon";

export type SheetStockRow = {
  ticker: string;
  companyName: string;
  holders: Array<{ slug: string; name: string }>;
};

function isPlaceholderPositionText(...parts: Array<string | null | undefined>): boolean {
  const hay = parts.filter(Boolean).join(" ").toUpperCase();
  return hay.includes("PLACEHOLDER");
}

async function loadCsvStocks(): Promise<SheetStockRow[]> {
  const byTicker = new Map<string, { companyName: string; holders: Map<string, string> }>();

  for (const row of getInvestors()) {
    const slug = normalizeTrackedInvestorSlug(row.investorSlug);
    if (!isTrackedInvestorSlug(slug)) continue;
    if (isPlaceholderPositionText(row.detail, row.sourceDetail)) continue;

    const ticker = normalizeTicker(row.ticker);
    if (!ticker) continue;

    const entry = byTicker.get(ticker) ?? { companyName: row.companyName, holders: new Map<string, string>() };
    if (!entry.companyName || entry.companyName === ticker) entry.companyName = row.companyName;
    entry.holders.set(slug, row.investor);
    byTicker.set(ticker, entry);
  }

  return [...byTicker.entries()]
    .map(([ticker, { companyName, holders }]) => ({
      ticker,
      companyName,
      holders: [...holders.entries()]
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
}

const loadCsvStocksCached = unstable_cache(loadCsvStocks, ["csv-synced-stocks-v1"], { revalidate: 3600 });

export async function getSheetSyncedStocks(): Promise<SheetStockRow[]> {
  return loadCsvStocksCached();
}

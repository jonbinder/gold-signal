/**
 * DORMANT for public UI — curated famous-investor ↔ ticker map (used by scoring pipeline when enabled).
 * Do not surface on stock or investor pages.
 */
import { getInvestors } from "@/lib/goldsignal/data";
import { normalizeInsiderTicker } from "@/lib/form4-insider";

export type FamousHolder = {
  slug: string;
  name: string;
};

export type WidelyHeldStock = {
  ticker: string;
  company: string;
  holderCount: number;
};

let holderIndex: Map<string, FamousHolder[]> | null = null;

function buildHolderIndex(): Map<string, FamousHolder[]> {
  const map = new Map<string, FamousHolder[]>();
  for (const inv of getInvestors()) {
    const seen = new Set<string>();
    for (const h of inv.holdings) {
      const sym = h.ticker?.trim().toUpperCase();
      if (!sym) continue;
      if (seen.has(sym)) continue;
      seen.add(sym);
      const list = map.get(sym) ?? [];
      list.push({ slug: inv.slug, name: inv.name.split(" – ")[0]?.trim() || inv.name });
      map.set(sym, list);
    }
  }
  return map;
}

function index(): Map<string, FamousHolder[]> {
  if (!holderIndex) holderIndex = buildHolderIndex();
  return holderIndex;
}

/** Tracked famous investors who hold this ticker (from curated investors.json). */
export function getInvestorsForTicker(ticker: string): FamousHolder[] {
  return index().get(normalizeInsiderTicker(ticker)) ?? [];
}

export function getHolderCountForTicker(ticker: string): number {
  return getInvestorsForTicker(ticker).length;
}

/** Stocks held by the most tracked investors, for homepage teaser. */
export function getMostWidelyHeldStocks(limit = 6): WidelyHeldStock[] {
  const inv = getInvestors();
  const counts = new Map<string, { count: number; company: string }>();

  for (const investor of inv) {
    const seen = new Set<string>();
    for (const h of investor.holdings) {
      const sym = h.ticker?.trim().toUpperCase();
      if (!sym || seen.has(sym)) continue;
      seen.add(sym);
      const prev = counts.get(sym);
      counts.set(sym, {
        count: (prev?.count ?? 0) + 1,
        company: h.company || prev?.company || sym,
      });
    }
  }

  return [...counts.entries()]
    .map(([ticker, { count, company }]) => ({ ticker, company, holderCount: count }))
    .sort((a, b) => b.holderCount - a.holderCount || a.ticker.localeCompare(b.ticker))
    .slice(0, limit);
}

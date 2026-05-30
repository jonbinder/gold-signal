import { getStockFactsModel } from "@/lib/stock-facts";
import { getInvestorsForTicker } from "@/lib/famous-holders";
import { computeInsiderNet90dUsd, fetchForm4Transactions, type InsiderTransactionRow } from "@/lib/form4-insider";
import {
  formatAsOfDate,
  formatInsiderNetLabel,
  formatMarketCapDisplay,
} from "@/lib/stock-facts-format";
import { getPolygonTickerDetails } from "@/lib/stock-profile";
import { normalizeTicker } from "@/lib/polygon";

export type PortfolioTickerFacts = {
  ticker: string;
  companyName: string;
  famousHolders: { slug: string; name: string }[];
  famousHolderCount: number;
  insiderRows: InsiderTransactionRow[];
  insiderNet90dUsd: number | null;
  insiderAsOf: string | null;
  marketCap: string;
  ceo: string | null;
};

/** Collects display facts for one ticker (cache-first, then live fetch for email pipeline). */
export async function collectTickerFacts(rawTicker: string): Promise<PortfolioTickerFacts> {
  const ticker = normalizeTicker(rawTicker);
  const cached = await getStockFactsModel(ticker);

  if (cached && cached.lastUpdated) {
    return {
      ticker,
      companyName: cached.name,
      famousHolders: cached.famousHolders,
      famousHolderCount: cached.famousHolderCount,
      insiderRows: cached.insider,
      insiderNet90dUsd: cached.insiderNet90dUsd,
      insiderAsOf: cached.insiderAsOf,
      marketCap: formatMarketCapDisplay(cached.marketCap),
      ceo: cached.ceo,
    };
  }

  const [details, insiderResult] = await Promise.all([
    getPolygonTickerDetails(ticker),
    fetchForm4Transactions(ticker),
  ]);

  const holders = getInvestorsForTicker(ticker);

  return {
    ticker,
    companyName: details?.name ?? ticker,
    famousHolders: holders,
    famousHolderCount: holders.length,
    insiderRows: insiderResult.rows,
    insiderNet90dUsd: computeInsiderNet90dUsd(insiderResult.rows),
    insiderAsOf: new Date().toISOString(),
    marketCap: formatMarketCapDisplay(details?.market_cap ?? null),
    ceo: null,
  };
}

export function formatFactsForPlainText(facts: PortfolioTickerFacts): string {
  const lines: string[] = [];
  lines.push(`${facts.companyName} (${facts.ticker})`);
  lines.push(`Market cap: ${facts.marketCap}`);
  if (facts.ceo) lines.push(`CEO: ${facts.ceo}`);

  if (facts.famousHolderCount === 0) {
    lines.push("Tracked investors: none on file");
  } else {
    lines.push(`Held by ${facts.famousHolderCount} tracked investor(s):`);
    for (const h of facts.famousHolders) {
      lines.push(`  • ${h.name}`);
    }
  }

  const net = formatInsiderNetLabel(facts.insiderNet90dUsd);
  const asOf = formatAsOfDate(facts.insiderAsOf);
  lines.push(`Insider activity (90d): ${net.text}${asOf ? ` (as of ${asOf})` : ""}`);

  if (facts.insiderRows.length === 0) {
    lines.push("Recent Form 4 transactions: none on file");
  } else {
    lines.push("Recent Form 4 transactions:");
    for (const r of facts.insiderRows.slice(0, 5)) {
      const val =
        r.valueUsd != null ? `$${Math.round(r.valueUsd).toLocaleString("en-US")}` : "—";
      lines.push(`  • ${r.type} — ${r.name} (${r.title}) — ${val} — ${r.date}`);
    }
  }

  return lines.join("\n");
}

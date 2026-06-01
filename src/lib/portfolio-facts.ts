import { collectStoredTickerReadout } from "@/lib/email/readout/collect-ticker-readout";
import type { TickerReadout } from "@/lib/email/readout/types";

/** @deprecated Use TickerReadout from @/lib/email/readout/types */
export type PortfolioTickerFacts = TickerReadout;

/**
 * Collects stored filing readout for one ticker (cache + Supabase only — no live APIs).
 */
export async function collectTickerFacts(rawTicker: string): Promise<TickerReadout> {
  return collectStoredTickerReadout(rawTicker);
}

/** Plain-text preview for scripts and debugging. */
export function formatFactsForPlainText(readout: TickerReadout): string {
  if (!readout.onFile) {
    return `${readout.ticker}: We don't have recent filing activity on file yet.`;
  }

  const lines: string[] = [];
  lines.push(`${readout.companyName} (${readout.ticker})`);
  if (readout.marketCap) lines.push(`Market cap: ${readout.marketCap}`);

  lines.push(`Insider (90d): ${readout.insider.net90dLabel}`);
  if (readout.insider.transactions.length === 0) {
    lines.push("Recent Form 4: none on file");
  } else {
    for (const r of readout.insider.transactions.slice(0, 5)) {
      lines.push(`  • ${r.type} — ${r.name} (${r.title}) — ${r.date}`);
    }
  }

  if (readout.institutional.available) {
    lines.push(
      `13F: ${readout.institutional.holderCount} tracked fund(s)${readout.institutional.periodLabel ? ` (${readout.institutional.periodLabel})` : ""}`,
    );
  } else {
    lines.push("13F: no institutional data on file");
  }

  for (const s of readout.largeStakes) {
    lines.push(`Stake: ${s.filerName} ${s.ownershipPct}% (${s.kind})`);
  }

  return lines.join("\n");
}

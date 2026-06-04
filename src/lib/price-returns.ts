import type { CachedPricePoint } from "@/lib/charts/price-series";

function closeOnOrBefore(sorted: CachedPricePoint[], isoDate: string): number | null {
  let best: number | null = null;
  for (const p of sorted) {
    if (p.d <= isoDate) best = p.c;
    else break;
  }
  return best;
}

function isoMonthsBefore(anchorIso: string, months: number): string {
  const [y, m, d] = anchorIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCMonth(dt.getUTCMonth() - months);
  return dt.toISOString().slice(0, 10);
}

/** % price change vs ~1M / 3M / 12M ago using daily closes in cached 12m history. */
export function computeTrailingReturns(history: CachedPricePoint[] | null | undefined): {
  return1mPct: number | null;
  return3mPct: number | null;
  return1yPct: number | null;
} {
  if (!history?.length) {
    return { return1mPct: null, return3mPct: null, return1yPct: null };
  }
  const sorted = [...history].sort((a, b) => a.d.localeCompare(b.d));
  const latest = sorted[sorted.length - 1]!;
  const latestClose = latest.c;
  if (!Number.isFinite(latestClose) || latestClose <= 0) {
    return { return1mPct: null, return3mPct: null, return1yPct: null };
  }

  function pctFromMonthsAgo(months: number): number | null {
    const targetIso = isoMonthsBefore(latest.d, months);
    const pastClose = closeOnOrBefore(sorted, targetIso);
    if (pastClose == null || pastClose <= 0) return null;
    return ((latestClose - pastClose) / pastClose) * 100;
  }

  return {
    return1mPct: pctFromMonthsAgo(1),
    return3mPct: pctFromMonthsAgo(3),
    return1yPct: pctFromMonthsAgo(12),
  };
}

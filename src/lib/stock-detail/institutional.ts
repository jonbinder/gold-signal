import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getTrackedFundSlugs } from "@/lib/funds/config";
import { fetchLatestReportingPeriod } from "@/lib/reporting-periods";
import type { InstitutionalSummary, TrackedFundHolder } from "@/lib/stock-detail/types";

type HoldingRow = {
  change_type: string | null;
  change_pct: number | null;
  portfolio_pct: number | null;
  value_usd: number | null;
  investor: { slug: string; name: string } | null;
};

type HoldingRowRaw = Omit<HoldingRow, "investor"> & {
  investor: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

function normalizeHoldingRows(raw: HoldingRowRaw[] | null): HoldingRow[] {
  return (raw ?? []).map((row) => {
    const inv = row.investor;
    const investor = Array.isArray(inv) ? (inv[0] ?? null) : inv;
    return { ...row, investor };
  });
}

const EMPTY_INSTITUTIONAL: InstitutionalSummary = {
  available: false,
  periodLabel: null,
  periodEnd: null,
  holderCount: 0,
  netChangeSummary: null,
  newPositions: 0,
  additions: 0,
  reductions: 0,
  exits: 0,
};

function summarizeNetChange(holdings: HoldingRow[]): string | null {
  const adds = holdings.filter((h) => h.change_type === "new" || h.change_type === "add").length;
  const trims = holdings.filter((h) => h.change_type === "reduce").length;
  const exits = holdings.filter((h) => h.change_type === "sell").length;
  const unchanged = holdings.filter((h) => h.change_type === "unchanged").length;

  if (holdings.length === 0) return null;
  const parts: string[] = [];
  if (adds > 0) parts.push(`${adds} fund${adds === 1 ? "" : "s"} added or increased`);
  if (trims > 0) parts.push(`${trims} trimmed`);
  if (exits > 0) parts.push(`${exits} exited`);
  if (parts.length === 0 && unchanged > 0) return `${unchanged} holder${unchanged === 1 ? "" : "s"} unchanged vs prior quarter`;
  return parts.length > 0 ? parts.join(" · ") : null;
}

async function loadInstitutionalData(ticker: string): Promise<{
  institutional: InstitutionalSummary;
  fundHolders: TrackedFundHolder[];
}> {
  const sym = ticker.trim().toUpperCase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return { institutional: EMPTY_INSTITUTIONAL, fundHolders: [] };
  }

  const supabase = createClient(url, key);

  const period = await fetchLatestReportingPeriod(supabase);

  if (!period?.id) {
    return { institutional: EMPTY_INSTITUTIONAL, fundHolders: [] };
  }

  const { data: security } = await supabase
    .from("securities")
    .select("id")
    .eq("ticker", sym)
    .maybeSingle();

  if (!security?.id) {
    return {
      institutional: {
        ...EMPTY_INSTITUTIONAL,
        available: false,
        periodLabel: period.label,
        periodEnd: period.period_end,
      },
      fundHolders: [],
    };
  }

  const { data: holdingsRaw, error: holdingsError } = await supabase
    .from("holdings")
    .select(
      `
      change_type,
      change_pct,
      portfolio_pct,
      value_usd,
      investor:investors(slug, name)
    `,
    )
    .eq("security_id", security.id)
    .eq("period_id", period.id)
    .order("value_usd", { ascending: false });

  const holdings = normalizeHoldingRows(holdingsRaw as HoldingRowRaw[] | null);

  const { data: stats } = await supabase
    .from("security_ownership_stats")
    .select("owner_count, new_buyers, sellers")
    .eq("security_id", security.id)
    .eq("period_id", period.id)
    .maybeSingle();

  const trackedSlugs = await getTrackedFundSlugs();

  const fundHolders: TrackedFundHolder[] = holdings
    .filter((h) => h.investor?.slug && trackedSlugs.has(h.investor.slug))
    .map((h) => ({
      slug: h.investor!.slug,
      name: h.investor!.name,
      portfolioPct: h.portfolio_pct != null ? Number(h.portfolio_pct) : null,
      changeType: h.change_type,
      valueUsd: h.value_usd != null ? Number(h.value_usd) : null,
    }));

  const holderCount = holdings.length > 0 ? holdings.length : (stats?.owner_count ?? 0);

  const institutional: InstitutionalSummary = {
    available: !holdingsError && (holderCount > 0 || stats != null),
    periodLabel: period.label,
    periodEnd: period.period_end,
    holderCount,
    netChangeSummary: summarizeNetChange(holdings),
    newPositions: holdings.filter((h) => h.change_type === "new").length,
    additions: holdings.filter((h) => h.change_type === "add").length,
    reductions: holdings.filter((h) => h.change_type === "reduce").length,
    exits: holdings.filter((h) => h.change_type === "sell").length,
  };

  if (stats && !institutional.netChangeSummary) {
    const parts: string[] = [];
    if (stats.new_buyers > 0) parts.push(`${stats.new_buyers} new buyer${stats.new_buyers === 1 ? "" : "s"}`);
    if (stats.sellers > 0) parts.push(`${stats.sellers} full exit${stats.sellers === 1 ? "" : "s"}`);
    institutional.netChangeSummary = parts.length > 0 ? parts.join(" · ") : null;
  }

  return { institutional, fundHolders };
}

export const getInstitutionalForTicker = cache(loadInstitutionalData);

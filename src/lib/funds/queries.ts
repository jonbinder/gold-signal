import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { readFundsConfig, type TrackedFundConfig } from "@/lib/funds/config";
import { isPreciousMetalSector } from "@/lib/funds/match-holding";

export type FundListItem = {
  slug: string;
  name: string;
  managerName: string | null;
  focusNote: string;
  website: string | null;
  pmHoldingsCount: number;
  totalHoldingsCount: number;
  periodLabel: string | null;
  hasHoldings: boolean;
};

export type FundHoldingRow = {
  ticker: string;
  company: string;
  shares: number;
  valueUsd: number;
  portfolioPct: number | null;
  changeType: string | null;
  isPreciousMetal: boolean;
  sector: string | null;
};

export type FundDetail = {
  config: TrackedFundConfig;
  periodLabel: string | null;
  periodEnd: string | null;
  holdings: FundHoldingRow[];
  pmHoldingsCount: number;
};

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

type HoldingDbRow = {
  shares: number;
  value_usd: number;
  portfolio_pct: number | null;
  change_type: string | null;
  security:
    | { ticker: string; name: string; sector: string | null }
    | { ticker: string; name: string; sector: string | null }[]
    | null;
};

function pickSecurity(
  sec: HoldingDbRow["security"],
): { ticker: string; name: string; sector: string | null } | null {
  if (!sec) return null;
  return Array.isArray(sec) ? (sec[0] ?? null) : sec;
}

function normalizeHoldings(raw: HoldingDbRow[] | null): FundHoldingRow[] {
  const rows: FundHoldingRow[] = [];
  for (const h of raw ?? []) {
    const sec = pickSecurity(h.security);
    if (!sec?.ticker) continue;
    rows.push({
      ticker: sec.ticker.toUpperCase(),
      company: sec.name,
      shares: Number(h.shares),
      valueUsd: Number(h.value_usd),
      portfolioPct: h.portfolio_pct != null ? Number(h.portfolio_pct) : null,
      changeType: h.change_type,
      isPreciousMetal: isPreciousMetalSector(sec.sector),
      sector: sec.sector,
    });
  }
  return rows.sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0));
}

async function loadFundHoldingsFromDb(slug: string): Promise<{
  holdings: FundHoldingRow[];
  periodLabel: string | null;
  periodEnd: string | null;
} | null> {
  const supabase = getAnonClient();
  if (!supabase) return null;

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!investor?.id) return null;

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id, label, period_end")
    .eq("is_latest", true)
    .maybeSingle();

  if (!period?.id) return { holdings: [], periodLabel: null, periodEnd: null };

  const { data: holdingsRaw } = await supabase
    .from("holdings")
    .select(
      `
      shares,
      value_usd,
      portfolio_pct,
      change_type,
      security:securities(ticker, name, sector)
    `,
    )
    .eq("investor_id", investor.id)
    .eq("period_id", period.id)
    .order("value_usd", { ascending: false });

  const holdings = normalizeHoldings(holdingsRaw as HoldingDbRow[] | null);
  return {
    holdings,
    periodLabel: period.label,
    periodEnd: period.period_end,
  };
}

export const getFundDetail = cache(async (slug: string): Promise<FundDetail | null> => {
  const config = (await readFundsConfig()).find((f) => f.slug === slug);
  if (!config) return null;

  const fromDb = await loadFundHoldingsFromDb(slug);
  const holdings = fromDb?.holdings ?? [];
  const pmHoldingsCount = holdings.filter((h) => h.isPreciousMetal).length;

  return {
    config,
    periodLabel: fromDb?.periodLabel ?? null,
    periodEnd: fromDb?.periodEnd ?? null,
    holdings,
    pmHoldingsCount,
  };
});

async function loadAllFundSummaries(): Promise<Map<string, { pm: number; total: number; periodLabel: string | null }>> {
  const supabase = getAnonClient();
  const map = new Map<string, { pm: number; total: number; periodLabel: string | null }>();
  if (!supabase) return map;

  const configs = await readFundsConfig();
  const slugs = configs.map((f) => f.slug);

  const { data: investors } = await supabase.from("investors").select("id, slug").in("slug", slugs);
  if (!investors?.length) return map;

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id, label")
    .eq("is_latest", true)
    .maybeSingle();

  if (!period?.id) return map;

  const investorIds = investors.map((i) => i.id);
  const slugById = new Map(investors.map((i) => [i.id as string, i.slug as string]));

  const { data: holdings } = await supabase
    .from("holdings")
    .select("investor_id, security:securities(sector)")
    .in("investor_id", investorIds)
    .eq("period_id", period.id);

  for (const h of holdings ?? []) {
    const slug = slugById.get(h.investor_id as string);
    if (!slug) continue;
    const rawSec = h.security as unknown as { sector: string | null } | { sector: string | null }[] | null;
    const sec = Array.isArray(rawSec) ? (rawSec[0] ?? null) : rawSec;
    const entry = map.get(slug) ?? { pm: 0, total: 0, periodLabel: period.label };
    entry.total += 1;
    if (isPreciousMetalSector(sec?.sector ?? null)) entry.pm += 1;
    map.set(slug, entry);
  }

  return map;
}

export type FundSort = "name" | "pm-holdings";

export const getFundsList = cache(async (sort: FundSort = "name"): Promise<FundListItem[]> => {
  const configs = await readFundsConfig();
  const summaries = await loadAllFundSummaries();

  const items: FundListItem[] = configs.map((c) => {
    const summary = summaries.get(c.slug);
    return {
      slug: c.slug,
      name: c.display_name,
      managerName: c.manager_name,
      focusNote: c.focus_note,
      website: c.website,
      pmHoldingsCount: summary?.pm ?? 0,
      totalHoldingsCount: summary?.total ?? 0,
      periodLabel: summary?.periodLabel ?? null,
      hasHoldings: (summary?.total ?? 0) > 0,
    };
  });

  if (sort === "pm-holdings") {
    return items.sort((a, b) => b.pmHoldingsCount - a.pmHoldingsCount || a.name.localeCompare(b.name));
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
});

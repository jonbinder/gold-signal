import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeClientLogoUrl } from "@/lib/stock-branding";
import { normalizeTicker } from "@/lib/polygon";
import { getPublishedInvestorsList } from "@/lib/investors/queries";
import type { InvestorListItem } from "@/lib/investors/types";
import { createSupabasePublicClient, createSupabaseServiceClient } from "@/lib/supabase";
import type { HomeDashboardModel, HomeMostHeldRow, HomePopularInvestorRow } from "@/lib/home/types";

const MOST_HELD_CAP = 10;
const RECENT_PORTFOLIOS_CAP = 6;

function getServerClient(): SupabaseClient | null {
  return createSupabaseServiceClient() ?? createSupabasePublicClient();
}

async function loadPublishedInvestorIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase.from("investors").select("id").eq("is_published", true);
  return new Set((data ?? []).map((r) => (r as { id: string }).id));
}

async function loadInvestorLastUpdatedAt(
  supabase: SupabaseClient,
  investors: InvestorListItem[],
): Promise<Map<string, string>> {
  const ids = investors.map((i) => i.id);
  const fundIds = investors.filter((i) => i.type === "fund").map((i) => i.id);
  const merged = new Map<string, string>();

  const pickMax = (id: string, ts: string) => {
    const prev = merged.get(id);
    if (!prev || ts > prev) merged.set(id, ts);
  };

  const [{ data: profileRows }, { data: positionRows }] = await Promise.all([
    supabase.from("investors").select("id, updated_at").in("id", ids),
    supabase
      .from("investor_positions")
      .select("investor_id, updated_at")
      .in("investor_id", ids)
      .eq("is_published", true),
  ]);

  for (const row of profileRows ?? []) {
    const ts = (row as { updated_at: string | null }).updated_at;
    if (ts) pickMax((row as { id: string }).id, ts);
  }

  for (const row of positionRows ?? []) {
    const ts = (row as { updated_at: string | null }).updated_at;
    if (ts) pickMax((row as { investor_id: string }).investor_id, ts);
  }

  if (fundIds.length > 0) {
    const { data: period } = await supabase
      .from("reporting_periods")
      .select("id, period_end")
      .eq("is_latest", true)
      .maybeSingle();

    if (period?.id) {
      const { data: holdings } = await supabase
        .from("holdings")
        .select("investor_id")
        .in("investor_id", fundIds)
        .eq("period_id", period.id);

      const periodEnd = (period as { period_end: string }).period_end;
      const periodTs = `${periodEnd}T23:59:59.000Z`;
      for (const row of holdings ?? []) {
        pickMax((row as { investor_id: string }).investor_id, periodTs);
      }
    }
  }

  return merged;
}

function sortByRecentUpdate(
  investors: InvestorListItem[],
  lastUpdated: Map<string, string>,
): InvestorListItem[] {
  return [...investors].sort((a, b) => {
    const aTs = lastUpdated.get(a.id) ?? "";
    const bTs = lastUpdated.get(b.id) ?? "";
    if (aTs !== bTs) return bTs.localeCompare(aTs);
    return a.name.localeCompare(b.name);
  });
}

async function loadMostHeld(supabase: SupabaseClient): Promise<HomeMostHeldRow[]> {
  const publishedIds = await loadPublishedInvestorIds(supabase);
  if (publishedIds.size === 0) return [];

  const byTicker = new Map<string, { companyName: string; investors: Set<string> }>();

  const { data: positions } = await supabase
    .from("investor_positions")
    .select("ticker, company_name, investor_id")
    .eq("is_published", true);

  for (const row of positions ?? []) {
    const investorId = (row as { investor_id: string }).investor_id;
    if (!publishedIds.has(investorId)) continue;
    const ticker = normalizeTicker((row as { ticker: string }).ticker);
    if (!ticker) continue;
    const companyName =
      (row as { company_name?: string }).company_name?.trim() || ticker;
    const entry = byTicker.get(ticker) ?? { companyName, investors: new Set<string>() };
    entry.investors.add(investorId);
    if (!entry.companyName || entry.companyName === ticker) entry.companyName = companyName;
    byTicker.set(ticker, entry);
  }

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id")
    .eq("is_latest", true)
    .maybeSingle();

  if (period?.id) {
    const { data: holdings } = await supabase
      .from("holdings")
      .select("investor_id, security:securities(ticker, name)")
      .eq("period_id", period.id);

    for (const row of holdings ?? []) {
      const investorId = (row as { investor_id: string }).investor_id;
      if (!publishedIds.has(investorId)) continue;
      const secRaw = (row as { security?: { ticker?: string; name?: string } | { ticker?: string; name?: string }[] })
        .security;
      const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw;
      const ticker = sec?.ticker ? normalizeTicker(sec.ticker) : "";
      if (!ticker) continue;
      const companyName = sec?.name?.trim() || ticker;
      const entry = byTicker.get(ticker) ?? { companyName, investors: new Set<string>() };
      entry.investors.add(investorId);
      byTicker.set(ticker, entry);
    }
  }

  const ranked = [...byTicker.entries()]
    .map(([ticker, { companyName, investors }]) => ({
      ticker,
      companyName,
      holderCount: investors.size,
    }))
    .filter((r) => r.holderCount > 0)
    .sort((a, b) => b.holderCount - a.holderCount || a.ticker.localeCompare(b.ticker))
    .slice(0, MOST_HELD_CAP);

  if (ranked.length === 0) return [];

  const tickers = ranked.map((r) => r.ticker);
  const { data: cacheRows } = await supabase
    .from("stock_data_cache")
    .select("ticker, logo_url, sub_category")
    .in("ticker", tickers);

  const meta = new Map<string, { logoUrl: string; subCategory: string }>();
  for (const row of cacheRows ?? []) {
    const sym = normalizeTicker((row as { ticker: string }).ticker);
    meta.set(sym, {
      logoUrl: normalizeClientLogoUrl((row as { logo_url: string | null }).logo_url, sym) ?? "",
      subCategory: (row as { sub_category?: string }).sub_category ?? "gold",
    });
  }

  return ranked.map((row) => {
    const m = meta.get(row.ticker);
    return {
      ...row,
      logoUrl: m?.logoUrl ?? "",
      subCategory: m?.subCategory ?? "gold",
    };
  });
}

async function loadRecentlyUpdatedPortfolios(
  supabase: SupabaseClient | null,
): Promise<HomePopularInvestorRow[]> {
  const investors = await getPublishedInvestorsList();
  const withPositions = investors.filter((inv) => inv.positionCount > 0);
  if (withPositions.length === 0) return [];

  const lastUpdated = supabase
    ? await loadInvestorLastUpdatedAt(supabase, withPositions)
    : new Map<string, string>();

  const sorted = sortByRecentUpdate(withPositions, lastUpdated);

  return sorted.slice(0, RECENT_PORTFOLIOS_CAP).map((inv) => ({
    slug: inv.slug,
    name: inv.name,
    firm:
      inv.titleRole?.trim() ||
      (inv.type === "fund" ? "Fund" : "Independent investor"),
    stockCount: inv.positionCount,
    lastUpdatedAt: lastUpdated.get(inv.id) ?? "",
  }));
}

export const getHomeDashboard = cache(async (): Promise<HomeDashboardModel> => {
  const supabase = getServerClient();
  const [popularPortfolios, mostHeld] = await Promise.all([
    loadRecentlyUpdatedPortfolios(supabase),
    supabase ? loadMostHeld(supabase) : Promise.resolve([]),
  ]);

  return {
    popularPortfolios,
    mostHeld,
    panels: {
      popularPortfolios: popularPortfolios.length > 0,
      mostHeld: mostHeld.length > 0,
    },
  };
});

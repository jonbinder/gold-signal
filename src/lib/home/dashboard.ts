import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getInvestorPositions } from "@/lib/investors/csv-data";
import { getPublishedInvestorsList } from "@/lib/investors/queries";
import { isTrackedInvestorSlug, normalizeTrackedInvestorSlug } from "@/lib/investors/tracked-roster";
import { normalizeClientLogoUrl } from "@/lib/stock-branding";
import { normalizeTicker } from "@/lib/polygon";
import { createSupabasePublicClient, createSupabaseServiceClient } from "@/lib/supabase";
import type { HomeDashboardModel, HomeMostHeldRow, HomePopularInvestorRow } from "@/lib/home/types";

const MOST_HELD_CAP = 10;
const RECENT_PORTFOLIOS_CAP = 6;

function getServerClient(): SupabaseClient | null {
  return createSupabaseServiceClient() ?? createSupabasePublicClient();
}

async function loadMostHeld(supabase: SupabaseClient): Promise<HomeMostHeldRow[]> {
  const byTicker = new Map<string, { companyName: string; investors: Set<string> }>();

  for (const row of getInvestorPositions()) {
    const slug = normalizeTrackedInvestorSlug(row.investorSlug);
    if (!isTrackedInvestorSlug(slug)) continue;
    const ticker = normalizeTicker(row.ticker);
    if (!ticker) continue;
    const companyName = row.companyName.trim() || ticker;
    const entry = byTicker.get(ticker) ?? { companyName, investors: new Set<string>() };
    entry.investors.add(slug);
    if (!entry.companyName || entry.companyName === ticker) entry.companyName = companyName;
    byTicker.set(ticker, entry);
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

async function loadRecentlyUpdatedPortfolios(): Promise<HomePopularInvestorRow[]> {
  const investors = await getPublishedInvestorsList();
  return investors
    .filter((inv) => inv.positionCount > 0)
    .slice(0, RECENT_PORTFOLIOS_CAP)
    .map((inv) => ({
      slug: inv.slug,
      name: inv.name,
      firm:
        inv.titleRole?.trim() ||
        (inv.type === "fund" ? "Fund" : "Independent investor"),
      bioShort: inv.bioShort,
      photoUrl: inv.photoUrl,
      stockCount: inv.positionCount,
      lastUpdatedAt: inv.updatedAt,
    }));
}

export const getHomeDashboard = cache(async (): Promise<HomeDashboardModel> => {
  const supabase = getServerClient();
  const [popularPortfolios, mostHeld] = await Promise.all([
    loadRecentlyUpdatedPortfolios(),
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

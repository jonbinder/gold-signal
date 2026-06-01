import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getTrackedFundSlugs } from "@/lib/funds/config";
import { readInvestorsData } from "@/lib/investors";

export type FundHolder = {
  slug: string;
  name: string;
  portfolioPct: number | null;
  changeType: string | null;
};

async function loadFundHoldersFromJson(ticker: string): Promise<FundHolder[]> {
  const sym = ticker.trim().toUpperCase();
  try {
    const [investors, trackedSlugs] = await Promise.all([readInvestorsData(), getTrackedFundSlugs()]);
    const holders: FundHolder[] = [];
    for (const inv of investors) {
      if (!trackedSlugs.has(inv.slug)) continue;
      const row = inv.portfolio.find((p) => p.ticker.trim().toUpperCase() === sym);
      if (!row) continue;
      holders.push({
        slug: inv.slug,
        name: inv.name,
        portfolioPct: row.percentage,
        changeType: null,
      });
    }
    return holders.sort((a, b) => (b.portfolioPct ?? 0) - (a.portfolioPct ?? 0));
  } catch {
    return [];
  }
}

const loadFundHoldersFromSupabase = cache(async (ticker: string): Promise<FundHolder[]> => {
  const sym = ticker.trim().toUpperCase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return [];

  const supabase = createClient(url, key);

  const { data: security } = await supabase
    .from("securities")
    .select("id")
    .eq("ticker", sym)
    .maybeSingle();

  if (!security?.id) return [];

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id")
    .eq("is_latest", true)
    .maybeSingle();

  if (!period?.id) return [];

  const { data: holdings, error } = await supabase
    .from("holdings")
    .select(
      `
      portfolio_pct,
      change_type,
      investor:investors(slug, name)
    `,
    )
    .eq("security_id", security.id)
    .eq("period_id", period.id)
    .order("value_usd", { ascending: false });

  if (error || !holdings?.length) return [];

  const trackedSlugs = await getTrackedFundSlugs();
  const holders: FundHolder[] = [];
  for (const h of holdings) {
    const inv = h.investor as { slug?: string; name?: string } | null;
    if (!inv?.slug || !inv?.name || !trackedSlugs.has(inv.slug)) continue;
    holders.push({
      slug: inv.slug,
      name: inv.name,
      portfolioPct: h.portfolio_pct != null ? Number(h.portfolio_pct) : null,
      changeType: (h.change_type as string) ?? null,
    });
  }

  return holders;
});

/** Tracked precious-metals funds holding this ticker (13F / curated sync). */
export async function getFundHoldersForTicker(ticker: string): Promise<FundHolder[]> {
  const fromDb = await loadFundHoldersFromSupabase(ticker);
  if (fromDb.length > 0) return fromDb;
  return loadFundHoldersFromJson(ticker);
}

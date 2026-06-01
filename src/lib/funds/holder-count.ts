import { createSupabaseServiceClient } from "@/lib/supabase";
import { getTrackedFundSlugs } from "@/lib/funds/config";
import { normalizeTicker } from "@/lib/polygon";

type HolderRow = {
  investor: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

/**
 * Count of tracked precious-metals funds holding this ticker in the latest 13F period.
 * Used for stock_data_cache.famous_holder_count (column name is legacy).
 */
export async function getTrackedFundHolderCount(ticker: string): Promise<number> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return 0;

  const sym = normalizeTicker(ticker);
  const [{ data: security }, { data: period }, trackedSlugs] = await Promise.all([
    supabase.from("securities").select("id").eq("ticker", sym).maybeSingle(),
    supabase.from("reporting_periods").select("id").eq("is_latest", true).maybeSingle(),
    getTrackedFundSlugs(),
  ]);

  if (!security?.id || !period?.id || trackedSlugs.size === 0) return 0;

  const { data: holdings, error } = await supabase
    .from("holdings")
    .select("investor:investors(slug, name)")
    .eq("security_id", security.id)
    .eq("period_id", period.id);

  if (error || !holdings?.length) return 0;

  let count = 0;
  for (const row of holdings as HolderRow[]) {
    const inv = row.investor;
    const slug = Array.isArray(inv) ? inv[0]?.slug : inv?.slug;
    if (slug && trackedSlugs.has(slug)) count += 1;
  }
  return count;
}

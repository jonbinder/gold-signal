import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvestorType } from "@/lib/investors/types";

type InvestorIdRow = { id: string; type: InvestorType };

export async function loadInvestorLastUpdatedAt(
  supabase: SupabaseClient,
  investors: InvestorIdRow[],
): Promise<Map<string, string>> {
  const ids = investors.map((i) => i.id);
  const fundIds = investors.filter((i) => i.type === "fund").map((i) => i.id);
  const merged = new Map<string, string>();

  const pickMax = (id: string, ts: string) => {
    const prev = merged.get(id);
    if (!prev || ts > prev) merged.set(id, ts);
  };

  if (ids.length === 0) return merged;

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

export function sortInvestorsByRecentUpdate<T extends { id: string; name: string }>(
  investors: T[],
  lastUpdated: Map<string, string>,
): T[] {
  return [...investors].sort((a, b) => {
    const aTs = lastUpdated.get(a.id) ?? "";
    const bTs = lastUpdated.get(b.id) ?? "";
    if (aTs !== bTs) return bTs.localeCompare(aTs);
    return a.name.localeCompare(b.name);
  });
}

/** Bump investor.updated_at when portfolio positions are added or removed. */
export async function bumpInvestorPortfolioUpdatedAt(
  supabase: SupabaseClient,
  investorIds: string | string[],
): Promise<void> {
  const ids = (Array.isArray(investorIds) ? investorIds : [investorIds]).filter(Boolean);
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  await supabase.from("investors").update({ updated_at: now }).in("id", ids);
}

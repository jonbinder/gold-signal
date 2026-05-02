import { createClient } from "./supabase/server";
import type {
  Investor,
  HoldingWithSecurity,
  LeaderboardEntry,
  ReportingPeriod,
} from "@/types";

// ─── Investors ────────────────────────────────────────────────────────────────

export async function getInvestors(): Promise<Investor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`getInvestors: ${error.message}`);
  return data ?? [];
}

export async function getInvestorBySlug(slug: string): Promise<Investor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

// ─── Holdings ─────────────────────────────────────────────────────────────────

export async function getHoldingsForInvestor(
  investorId: string,
  periodId?: string
): Promise<HoldingWithSecurity[]> {
  const supabase = await createClient();

  let query = supabase
    .from("holdings")
    .select(
      `
      *,
      security:securities(*)
    `
    )
    .eq("investor_id", investorId)
    .order("value_usd", { ascending: false });

  if (periodId) {
    query = query.eq("period_id", periodId);
  } else {
    // Join to get only the latest period
    const latestPeriod = await getLatestPeriod();
    if (latestPeriod) {
      query = query.eq("period_id", latestPeriod.id);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`getHoldingsForInvestor: ${error.message}`);
  return (data as HoldingWithSecurity[]) ?? [];
}

// ─── Periods ──────────────────────────────────────────────────────────────────

export async function getLatestPeriod(): Promise<ReportingPeriod | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reporting_periods")
    .select("*")
    .eq("is_latest", true)
    .single();

  if (error) return null;
  return data;
}

export async function getAllPeriods(): Promise<ReportingPeriod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reporting_periods")
    .select("*")
    .order("period_end", { ascending: false });

  if (error) throw new Error(`getAllPeriods: ${error.message}`);
  return data ?? [];
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(
  periodId?: string,
  limit = 20
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const activePeriodId = periodId ?? (await getLatestPeriod())?.id;
  if (!activePeriodId) return [];

  const { data, error } = await supabase
    .from("security_ownership_stats")
    .select(
      `
      *,
      security:securities(*)
    `
    )
    .eq("period_id", activePeriodId)
    .order("owner_count", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getLeaderboard: ${error.message}`);

  return (data ?? []).map((row) => ({
    security: row.security,
    stats: {
      id: row.id,
      security_id: row.security_id,
      period_id: row.period_id,
      owner_count: row.owner_count,
      total_shares: row.total_shares,
      total_value_usd: row.total_value_usd,
      new_buyers: row.new_buyers,
      sellers: row.sellers,
      updated_at: row.updated_at,
    },
  }));
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function formatShares(shares: number): string {
  if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(2)}M`;
  if (shares >= 1_000) return `${(shares / 1_000).toFixed(0)}K`;
  return shares.toString();
}

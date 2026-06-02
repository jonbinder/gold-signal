import { readFundsConfig, type TrackedFundConfig } from "@/lib/funds/config";
import { matchIssuerToSecurity } from "@/lib/funds/match-holding";
import { fetchLatest13FHoldings, padCik } from "@/lib/sec-edgar-13f";
import { getSupabaseServiceRole } from "@/lib/supabase/service-role";

export type SyncFundsResult = {
  fundsProcessed: number;
  holdingsUpserted: number;
  skippedRows: number;
  periodLabel: string;
  errors: string[];
};

function getQuarterLabel(reportDate: string | null, filingDate: string): string {
  const d = reportDate ? new Date(reportDate) : new Date(filingDate);
  const month = d.getUTCMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${d.getUTCFullYear()}`;
}

type ChangeType = "new" | "add" | "reduce" | "sell" | "unchanged";

function computeChangeType(currentShares: number, prevShares: number | null): ChangeType {
  if (prevShares == null || prevShares === 0) return currentShares > 0 ? "new" : "unchanged";
  if (currentShares === 0) return "sell";
  if (currentShares > prevShares) return "add";
  if (currentShares < prevShares) return "reduce";
  return "unchanged";
}

function computeChangePct(currentShares: number, prevShares: number | null): number | null {
  if (prevShares == null || prevShares === 0) return null;
  return Math.round(((currentShares - prevShares) / prevShares) * 10000) / 100;
}

async function refreshOwnershipStats(
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceRole>>,
  periodId: string,
) {
  const { data: holdings, error } = await supabase
    .from("holdings")
    .select("security_id, change_type, shares, value_usd")
    .eq("period_id", periodId);

  if (error || !holdings?.length) return;

  const bySecurity = new Map<
    string,
    {
      owner_count: number;
      total_shares: number;
      total_value_usd: number;
      new_buyers: number;
      sellers: number;
    }
  >();

  for (const row of holdings) {
    const sid = row.security_id as string;
    const agg = bySecurity.get(sid) ?? {
      owner_count: 0,
      total_shares: 0,
      total_value_usd: 0,
      new_buyers: 0,
      sellers: 0,
    };
    agg.owner_count += 1;
    agg.total_shares += Number(row.shares) || 0;
    agg.total_value_usd += Number(row.value_usd) || 0;
    if (row.change_type === "new") agg.new_buyers += 1;
    if (row.change_type === "sell") agg.sellers += 1;
    bySecurity.set(sid, agg);
  }

  const payload = Array.from(bySecurity.entries()).map(([security_id, stats]) => ({
    security_id,
    period_id: periodId,
    ...stats,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from("security_ownership_stats").upsert(payload, {
    onConflict: "security_id,period_id",
  });
}

async function syncOneFund(
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceRole>>,
  fund: TrackedFundConfig,
  securities: Array<{ id: string; ticker: string; name: string; sector: string | null }>,
  periodRow: { id: string; label: string },
): Promise<{ holdings: number; skipped: number; error?: string }> {
  const edgarRes = await fetchLatest13FHoldings(fund.cik);
  if (!edgarRes.ok) {
    return { holdings: 0, skipped: 0, error: `${fund.slug}: ${edgarRes.error}` };
  }
  if (!edgarRes.data) {
    return { holdings: 0, skipped: 0, error: `${fund.slug}: no 13F-HR filing found` };
  }

  const { holdings: parsed } = edgarRes.data;

  const { data: priorPeriod } = await supabase
    .from("reporting_periods")
    .select("id")
    .neq("id", periodRow.id)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: investorRow, error: investorError } = await supabase
    .from("investors")
    .upsert(
      {
        slug: fund.slug,
        name: fund.display_name,
        cik: padCik(fund.cik),
        manager_name: fund.manager_name,
        focus_note: fund.focus_note,
        website_url: fund.website,
        focus: ["gold", "silver"],
        is_active: true,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (investorError || !investorRow) {
    return { holdings: 0, skipped: 0, error: investorError?.message ?? "investor upsert failed" };
  }

  const investorId = investorRow.id as string;
  const matched: Array<{
    security_id: string;
    shares: number;
    value_usd: number;
  }> = [];
  let skipped = 0;

  for (const row of parsed) {
    const sec = matchIssuerToSecurity(row.nameOfIssuer, securities);
    if (!sec) {
      skipped += 1;
      continue;
    }
    matched.push({
      security_id: sec.id,
      shares: row.shares,
      value_usd: row.valueUsd,
    });
  }

  // Deduplicate rows by security_id before upsert. Some 13F tables contain
  // multiple lines that map to the same security in our universe, which can
  // otherwise trigger: "ON CONFLICT DO UPDATE command cannot affect row a second time".
  const aggregatedBySecurity = new Map<string, { shares: number; value_usd: number }>();
  for (const row of matched) {
    const prev = aggregatedBySecurity.get(row.security_id) ?? { shares: 0, value_usd: 0 };
    prev.shares += row.shares;
    prev.value_usd += row.value_usd;
    aggregatedBySecurity.set(row.security_id, prev);
  }

  const dedupedMatched = Array.from(aggregatedBySecurity.entries()).map(([security_id, v]) => ({
    security_id,
    shares: Math.round(v.shares),
    value_usd: Math.round(v.value_usd),
  }));

  const totalValue = dedupedMatched.reduce((sum, r) => sum + r.value_usd, 0) || 1;

  let priorBySecurity = new Map<string, { shares: number; value_usd: number }>();
  if (priorPeriod?.id) {
    const { data: priorHoldings } = await supabase
      .from("holdings")
      .select("security_id, shares, value_usd")
      .eq("investor_id", investorId)
      .eq("period_id", priorPeriod.id);

    priorBySecurity = new Map(
      (priorHoldings ?? []).map((h) => [
        h.security_id as string,
        { shares: Number(h.shares), value_usd: Number(h.value_usd) },
      ]),
    );
  }

  const holdingsPayload = dedupedMatched.map((row) => {
    const prev = priorBySecurity.get(row.security_id);
    const change_type = computeChangeType(row.shares, prev?.shares ?? null);
    const portfolio_pct = Math.round((row.value_usd / totalValue) * 10000) / 100;
    return {
      investor_id: investorId,
      security_id: row.security_id,
      period_id: periodRow.id,
      shares: row.shares,
      value_usd: row.value_usd,
      portfolio_pct,
      shares_prev: prev?.shares ?? null,
      value_prev_usd: prev?.value_usd ?? null,
      change_type,
      change_pct: computeChangePct(row.shares, prev?.shares ?? null),
    };
  });

  if (holdingsPayload.length > 0) {
    const { error: holdingsError } = await supabase
      .from("holdings")
      .upsert(holdingsPayload, { onConflict: "investor_id,security_id,period_id" });
    if (holdingsError) {
      return { holdings: 0, skipped, error: holdingsError.message };
    }
  }

  return { holdings: holdingsPayload.length, skipped };
}

export async function syncFundsFromEdgar(filePath?: string): Promise<SyncFundsResult> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) {
    throw new Error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const funds = await readFundsConfig(filePath);
  const { data: securities, error: secError } = await supabase
    .from("securities")
    .select("id, ticker, name, sector")
    .eq("is_active", true);

  if (secError) {
    throw new Error(`Failed to load securities: ${secError.message}`);
  }

  const universe = (securities ?? []).map((s) => ({
    id: s.id as string,
    ticker: (s.ticker as string).toUpperCase(),
    name: s.name as string,
    sector: (s.sector as string | null) ?? null,
  }));

  let holdingsUpserted = 0;
  let skippedRows = 0;
  const errors: string[] = [];

  const bundles: Array<{
    fund: TrackedFundConfig;
    bundle: { filing: { reportDate: string | null; filingDate: string }; holdings: import("@/lib/sec-edgar-13f").Parsed13FHolding[] };
  }> = [];

  for (const fund of funds) {
    const edgarRes = await fetchLatest13FHoldings(fund.cik);
    if (!edgarRes.ok) {
      errors.push(`${fund.slug}: ${edgarRes.error}`);
      continue;
    }
    if (!edgarRes.data) {
      errors.push(`${fund.slug}: no 13F-HR filing found`);
      continue;
    }
    bundles.push({ fund, bundle: edgarRes.data });
  }

  if (bundles.length === 0) {
    return { fundsProcessed: funds.length, holdingsUpserted: 0, skippedRows: 0, periodLabel: "", errors };
  }

  const newest = bundles.reduce((best, cur) => {
    const curDate = cur.bundle.filing.reportDate ?? cur.bundle.filing.filingDate;
    const bestDate = best.bundle.filing.reportDate ?? best.bundle.filing.filingDate;
    return curDate > bestDate ? cur : best;
  });

  const periodLabel = getQuarterLabel(newest.bundle.filing.reportDate, newest.bundle.filing.filingDate);
  const periodEnd = newest.bundle.filing.reportDate ?? newest.bundle.filing.filingDate;

  const { error: clearLatestError } = await supabase
    .from("reporting_periods")
    .update({ is_latest: false })
    .eq("is_latest", true);
  if (clearLatestError) {
    throw new Error(`Failed to clear prior latest period: ${clearLatestError.message}`);
  }

  const { data: periodRow, error: periodError } = await supabase
    .from("reporting_periods")
    .upsert(
      { label: periodLabel, period_end: periodEnd, is_latest: true },
      { onConflict: "label" },
    )
    .select("id, label")
    .single();

  if (periodError || !periodRow) {
    throw new Error(`Failed to upsert reporting period: ${periodError?.message ?? "unknown"}`);
  }

  for (const { fund } of bundles) {
    const result = await syncOneFund(supabase, fund, universe, periodRow);
    holdingsUpserted += result.holdings;
    skippedRows += result.skipped;
    if (result.error) errors.push(result.error);
  }

  await refreshOwnershipStats(supabase, periodRow.id);

  return {
    fundsProcessed: funds.length,
    holdingsUpserted,
    skippedRows,
    periodLabel: periodRow.label,
    errors,
  };
}

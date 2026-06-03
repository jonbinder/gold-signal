import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsiderTransactionRow } from "@/lib/form4-insider";
import { normalizeClientLogoUrl } from "@/lib/stock-branding";
import { normalizeTicker } from "@/lib/polygon";
import { createSupabasePublicClient, createSupabaseServiceClient } from "@/lib/supabase";
import {
  formatFilingDateLabel,
  formatSharesCompact,
  formatUsdCompact,
} from "@/lib/whats-new/format";
import type {
  HomeBiggestPositionRow,
  HomeDashboardModel,
  HomeInsiderRow,
  HomeMostHeldRow,
  HomeRecentInvestorRow,
} from "@/lib/home/types";

const INSIDER_CAP = 40;
const MOST_HELD_CAP = 12;
const BIGGEST_CAP = 8;
const RECENT_INVESTORS_CAP = 6;
const TOP_BUYS_CAP = 6;
const MIN_TOP_BUYS = 2;

type CacheRow = {
  ticker: string;
  name: string;
  insider_transactions: InsiderTransactionRow[] | null;
};

function getServerClient(): SupabaseClient | null {
  return createSupabaseServiceClient() ?? createSupabasePublicClient();
}

function parseInsiderRows(raw: unknown): InsiderTransactionRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is InsiderTransactionRow =>
      r != null &&
      typeof r === "object" &&
      (r.type === "BUY" || r.type === "SELL") &&
      typeof (r as InsiderTransactionRow).dateIso === "string",
  );
}

function insiderSignificance(row: InsiderTransactionRow): number {
  const value = row.valueUsd ?? 0;
  const shares = row.shares ?? 0;
  return value > 0 ? value : shares * 10;
}

function buildSizeLabel(row: InsiderTransactionRow): string {
  const parts: string[] = [];
  const shares = formatSharesCompact(row.shares);
  const value = formatUsdCompact(row.valueUsd);
  if (shares) parts.push(`${shares} sh`);
  if (value) parts.push(value);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function mapInsiderRow(
  ticker: string,
  companyName: string,
  row: InsiderTransactionRow,
): HomeInsiderRow {
  const who = row.name && row.title ? `${row.name}, ${row.title}` : row.name || row.title || "Insider";
  return {
    id: `insider-${row.type}-${ticker}-${row.dateIso}-${row.name}-${row.type}`,
    ticker,
    companyName,
    type: row.type,
    dateIso: row.dateIso.slice(0, 10),
    dateLabel: formatFilingDateLabel(row.dateIso),
    insiderLabel: who,
    role: row.title || "",
    sizeLabel: buildSizeLabel(row),
  };
}

async function loadInsiderFeed(supabase: SupabaseClient | null): Promise<{
  rows: HomeInsiderRow[];
  note: string | null;
}> {
  if (!supabase) {
    return {
      rows: [],
      note: "Insider activity will appear as Form 4 filings are cached for tracked tickers.",
    };
  }

  const { data, error } = await supabase
    .from("stock_data_cache")
    .select("ticker, name, insider_transactions");

  if (error || !data?.length) {
    return {
      rows: [],
      note: "More activity will appear as SEC Form 4 filings are synced across the tracked universe.",
    };
  }

  const flat: HomeInsiderRow[] = [];
  const seen = new Set<string>();

  for (const row of data as CacheRow[]) {
    const sym = normalizeTicker(row.ticker);
    const company = row.name?.trim() || sym;
    for (const tx of parseInsiderRows(row.insider_transactions)) {
      const mapped = mapInsiderRow(sym, company, tx);
      if (seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      flat.push(mapped);
    }
  }

  flat.sort((a, b) => b.dateIso.localeCompare(a.dateIso) || b.ticker.localeCompare(a.ticker));
  const rows = flat.slice(0, INSIDER_CAP);

  return {
    rows,
    note:
      rows.length === 0
        ? "More activity will appear as SEC Form 4 filings are synced across the tracked universe."
        : rows.length < 5
          ? "Showing recent filings on file — more activity will appear as updates sync."
          : null,
  };
}

async function loadPublishedInvestorIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase.from("investors").select("id").eq("is_published", true);
  return new Set((data ?? []).map((r) => (r as { id: string }).id));
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

async function loadBiggestPositions(supabase: SupabaseClient): Promise<HomeBiggestPositionRow[]> {
  const publishedIds = await loadPublishedInvestorIds(supabase);
  if (publishedIds.size === 0) return [];

  const candidates: Array<HomeBiggestPositionRow & { rank: number }> = [];

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id")
    .eq("is_latest", true)
    .maybeSingle();

  if (period?.id) {
    const { data: holdings } = await supabase
      .from("holdings")
      .select(
        `
        value_usd,
        portfolio_pct,
        investor_id,
        investor:investors(slug, name, is_published),
        security:securities(ticker, name)
      `,
      )
      .eq("period_id", period.id)
      .order("value_usd", { ascending: false })
      .limit(30);

    for (const row of holdings ?? []) {
      const investorId = (row as { investor_id: string }).investor_id;
      if (!publishedIds.has(investorId)) continue;
      const invRaw = (row as {
        investor?: { slug?: string; name?: string; is_published?: boolean } | { slug?: string; name?: string; is_published?: boolean }[];
      }).investor;
      const inv = Array.isArray(invRaw) ? invRaw[0] : invRaw;
      if (!inv?.slug || !inv?.name || inv.is_published === false) continue;
      const secRaw = (row as { security?: { ticker?: string; name?: string } | { ticker?: string; name?: string }[] })
        .security;
      const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw;
      const ticker = sec?.ticker ? normalizeTicker(sec.ticker) : "";
      if (!ticker) continue;
      const valueUsd = Number((row as { value_usd?: number }).value_usd) || 0;
      const pct = (row as { portfolio_pct?: number }).portfolio_pct;
      const sizeLabel =
        formatUsdCompact(valueUsd) ||
        (pct != null && Number.isFinite(pct) ? `${Number(pct).toFixed(1)}% of portfolio` : "13F position");
      candidates.push({
        investorSlug: inv.slug,
        investorName: inv.name,
        ticker,
        companyName: sec?.name?.trim() || ticker,
        sizeLabel,
        rank: valueUsd > 0 ? valueUsd : (pct ?? 0) * 1_000_000,
      });
    }
  }

  const { data: manual } = await supabase
    .from("investor_positions")
    .select(
      `
      ticker,
      company_name,
      approx_size,
      detail,
      investor_id,
      investor:investors(slug, name, is_published)
    `,
    )
    .eq("is_published", true)
    .in("position_type", ["fund_holding", "stake_filing", "fund_13f", "other_disclosure"])
    .limit(40);

  for (const row of manual ?? []) {
    const investorId = (row as { investor_id: string }).investor_id;
    if (!publishedIds.has(investorId)) continue;
    const invRaw = (row as {
      investor?: { slug?: string; name?: string; is_published?: boolean } | { slug?: string; name?: string; is_published?: boolean }[];
    }).investor;
    const inv = Array.isArray(invRaw) ? invRaw[0] : invRaw;
    if (!inv?.slug || !inv?.name || inv.is_published === false) continue;
    const ticker = normalizeTicker((row as { ticker: string }).ticker);
    if (!ticker) continue;
    const sizeLabel =
      (row as { approx_size?: string }).approx_size?.trim() ||
      (row as { detail?: string }).detail?.trim().slice(0, 80) ||
      "Tracked position";
    candidates.push({
      investorSlug: inv.slug,
      investorName: inv.name,
      ticker,
      companyName: (row as { company_name?: string }).company_name?.trim() || ticker,
      sizeLabel,
      rank: 50_000,
    });
  }

  const seen = new Set<string>();
  const out: HomeBiggestPositionRow[] = [];
  for (const item of candidates.sort((a, b) => b.rank - a.rank)) {
    const key = `${item.investorSlug}|${item.ticker}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      investorSlug: item.investorSlug,
      investorName: item.investorName,
      ticker: item.ticker,
      companyName: item.companyName,
      sizeLabel: item.sizeLabel,
    });
    if (out.length >= BIGGEST_CAP) break;
  }

  return out;
}

async function loadRecentInvestors(supabase: SupabaseClient): Promise<HomeRecentInvestorRow[]> {
  const { data } = await supabase
    .from("investors")
    .select("slug, name, title_role, investor_type, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(RECENT_INVESTORS_CAP);

  return (data ?? []).map((row) => {
    const r = row as {
      slug: string;
      name: string;
      title_role: string | null;
      investor_type: string | null;
      updated_at: string;
    };
    const updated = r.updated_at?.slice(0, 10) ?? "";
    return {
      slug: r.slug,
      name: r.name,
      subtitle: r.title_role?.trim() || r.investor_type?.replace(/_/g, " ") || "Investor",
      updatedLabel: updated ? formatFilingDateLabel(updated) : "",
    };
  });
}

async function loadTopInsiderBuysFromCache(
  supabase: SupabaseClient | null,
): Promise<HomeInsiderRow[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from("stock_data_cache")
    .select("ticker, name, insider_transactions");

  if (!data?.length) return [];

  const buys: Array<{ row: HomeInsiderRow; significance: number }> = [];
  const seen = new Set<string>();

  for (const cacheRow of data as CacheRow[]) {
    const sym = normalizeTicker(cacheRow.ticker);
    const company = cacheRow.name?.trim() || sym;
    for (const tx of parseInsiderRows(cacheRow.insider_transactions)) {
      if (tx.type !== "BUY") continue;
      const mapped = mapInsiderRow(sym, company, tx);
      if (seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      buys.push({ row: mapped, significance: insiderSignificance(tx) });
    }
  }

  if (buys.length < MIN_TOP_BUYS) return [];

  return buys
    .sort((a, b) => b.significance - a.significance || b.row.dateIso.localeCompare(a.row.dateIso))
    .slice(0, TOP_BUYS_CAP)
    .map((b) => b.row);
}

export const getHomeDashboard = cache(async (): Promise<HomeDashboardModel> => {
  const supabase = getServerClient();

  const [
    { rows: insiderFeed, note: insiderFeedNote },
    mostHeld,
    biggestPositions,
    recentInvestors,
    topInsiderBuys,
  ] = await Promise.all([
    loadInsiderFeed(supabase),
    supabase ? loadMostHeld(supabase) : Promise.resolve([]),
    supabase ? loadBiggestPositions(supabase) : Promise.resolve([]),
    supabase ? loadRecentInvestors(supabase) : Promise.resolve([]),
    loadTopInsiderBuysFromCache(supabase),
  ]);

  return {
    insiderFeed,
    insiderFeedNote,
    mostHeld,
    biggestPositions,
    topInsiderBuys,
    recentInvestors,
    panels: {
      mostHeld: mostHeld.length > 0,
      biggestPositions: biggestPositions.length > 0,
      topInsiderBuys: topInsiderBuys.length >= MIN_TOP_BUYS,
      recentInvestors: recentInvestors.length > 0,
    },
  };
});

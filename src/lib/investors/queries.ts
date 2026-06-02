import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { normalizeTicker } from "@/lib/polygon";
import type {
  InvestorDetailModel,
  InvestorListItem,
  InvestorPosition,
  InvestorProfile,
  InvestorType,
} from "@/lib/investors/types";

type InvestorRow = {
  id: string;
  slug: string;
  name: string;
  investor_type: InvestorType | null;
  title_role: string | null;
  bio: string | null;
  photo_url: string | null;
  website: string | null;
  website_url: string | null;
  cik: string | null;
  focus_note: string | null;
  sort_order: number | null;
  is_published: boolean | null;
};

type PositionRow = {
  id: string;
  investor_id: string;
  ticker: string;
  company_name: string;
  position_type: InvestorPosition["positionType"];
  detail: string;
  approx_size: string | null;
  source_type: string;
  source_detail: string;
  as_of_date: string;
  why_interesting: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type HoldingAutoRow = {
  id: string;
  portfolio_pct: number | null;
  change_type: string | null;
  value_usd: number | null;
  security:
    | { ticker: string; name: string | null }
    | { ticker: string; name: string | null }[]
    | null;
};

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

function mapInvestor(row: InvestorRow): InvestorProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.investor_type ?? "fund",
    titleRole: row.title_role,
    bio: row.bio,
    photoUrl: row.photo_url,
    website: row.website ?? row.website_url,
    cik: row.cik,
    focusNote: row.focus_note,
    sortOrder: row.sort_order ?? 100,
    isPublished: row.is_published ?? false,
  };
}

function mapManualPosition(row: PositionRow): InvestorPosition {
  return {
    id: row.id,
    investorId: row.investor_id,
    ticker: normalizeTicker(row.ticker),
    companyName: row.company_name,
    positionType: row.position_type,
    detail: row.detail,
    approxSize: row.approx_size,
    sourceType: row.source_type,
    sourceDetail: row.source_detail,
    asOfDate: row.as_of_date,
    whyInteresting: row.why_interesting,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isAuto13f: false,
  };
}

function securityFromHolding(
  security: HoldingAutoRow["security"],
): { ticker: string; name: string | null } | null {
  if (!security) return null;
  return Array.isArray(security) ? (security[0] ?? null) : security;
}

function formatValueUsd(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

async function loadAuto13fPositions(
  investorId: string,
): Promise<{ positions: InvestorPosition[]; count: number }> {
  const supabase = getAnonClient();
  if (!supabase) return { positions: [], count: 0 };

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id, label, period_end")
    .eq("is_latest", true)
    .maybeSingle();
  if (!period?.id) return { positions: [], count: 0 };

  const { data: holdings } = await supabase
    .from("holdings")
    .select(
      `
      id,
      portfolio_pct,
      change_type,
      value_usd,
      security:securities(ticker, name)
    `,
    )
    .eq("investor_id", investorId)
    .eq("period_id", period.id)
    .order("value_usd", { ascending: false });

  const rows = (holdings ?? []) as HoldingAutoRow[];
  const positions: InvestorPosition[] = [];
  for (const row of rows) {
    const sec = securityFromHolding(row.security);
    if (!sec?.ticker) continue;
    const value = formatValueUsd(row.value_usd != null ? Number(row.value_usd) : null);
    const pct =
      row.portfolio_pct != null && Number.isFinite(Number(row.portfolio_pct))
        ? `${Number(row.portfolio_pct).toFixed(1)}% of 13F portfolio`
        : null;
    const detailParts = [
      row.change_type ? `13F ${row.change_type}` : "13F reported position",
      value ? `value ${value}` : null,
      pct,
    ].filter(Boolean);
    positions.push({
      id: `auto13f-${period.id}-${row.id}`,
      investorId,
      ticker: normalizeTicker(sec.ticker),
      companyName: sec.name ?? normalizeTicker(sec.ticker),
      positionType: "fund_13f",
      detail: detailParts.join(" · "),
      approxSize: pct,
      sourceType: "SEC 13F",
      sourceDetail: `${period.label} 13F filing`,
      asOfDate: period.period_end ?? new Date().toISOString().slice(0, 10),
      whyInteresting: null,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAuto13f: true,
    });
  }

  return { positions, count: positions.length };
}

export type InvestorSort = "name" | "positions" | "type";

export const getPublishedInvestors = cache(
  async (sort: InvestorSort = "name"): Promise<InvestorListItem[]> => {
    const supabase = getAnonClient();
    if (!supabase) return [];

    const { data: investorsRaw } = await supabase
      .from("investors")
      .select(
        "id, slug, name, investor_type, title_role, bio, photo_url, website, website_url, cik, focus_note, sort_order, is_published",
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const investors = ((investorsRaw ?? []) as InvestorRow[]).map(mapInvestor);
    if (investors.length === 0) return [];

    const ids = investors.map((i) => i.id);
    const { data: manualCounts } = await supabase
      .from("investor_positions")
      .select("investor_id")
      .in("investor_id", ids)
      .eq("is_published", true);

    const manualById = new Map<string, number>();
    for (const row of manualCounts ?? []) {
      const id = (row as { investor_id: string }).investor_id;
      manualById.set(id, (manualById.get(id) ?? 0) + 1);
    }

    const autoCountById = new Map<string, number>();
    await Promise.all(
      investors
        .filter((i) => i.type === "fund")
        .map(async (i) => {
          const { count } = await loadAuto13fPositions(i.id);
          autoCountById.set(i.id, count);
        }),
    );

    const list = investors.map((investor) => {
      const manualPositionCount = manualById.get(investor.id) ?? 0;
      const auto13fPositionCount = autoCountById.get(investor.id) ?? 0;
      return {
        ...investor,
        manualPositionCount,
        auto13fPositionCount,
        positionCount: manualPositionCount + auto13fPositionCount,
      };
    });

    if (sort === "positions") {
      return list.sort((a, b) => b.positionCount - a.positionCount || a.name.localeCompare(b.name));
    }
    if (sort === "type") {
      return list.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  },
);

export const getInvestorDetail = cache(async (slug: string): Promise<InvestorDetailModel | null> => {
  const supabase = getAnonClient();
  if (!supabase) return null;

  const { data: investorRaw } = await supabase
    .from("investors")
    .select(
      "id, slug, name, investor_type, title_role, bio, photo_url, website, website_url, cik, focus_note, sort_order, is_published",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!investorRaw) return null;
  const investor = mapInvestor(investorRaw as InvestorRow);

  const { data: manualRaw } = await supabase
    .from("investor_positions")
    .select(
      "id, investor_id, ticker, company_name, position_type, detail, approx_size, source_type, source_detail, as_of_date, why_interesting, is_published, created_at, updated_at",
    )
    .eq("investor_id", investor.id)
    .eq("is_published", true)
    .order("as_of_date", { ascending: false });
  const manualPositions = ((manualRaw ?? []) as PositionRow[]).map(mapManualPosition);

  const auto = investor.type === "fund" ? await loadAuto13fPositions(investor.id) : { positions: [], count: 0 };
  const positions = [...manualPositions, ...auto.positions].sort((a, b) =>
    b.asOfDate.localeCompare(a.asOfDate),
  );

  return {
    investor,
    positions,
    manualPositionCount: manualPositions.length,
    auto13fPositionCount: auto.count,
  };
});

export const getPublishedInvestorsForTicker = cache(
  async (ticker: string): Promise<Array<{ slug: string; name: string; type: InvestorType }>> => {
    const supabase = getAnonClient();
    if (!supabase) return [];
    const sym = normalizeTicker(ticker);

    const { data: manual } = await supabase
      .from("investor_positions")
      .select("investor_id, investor:investors(slug, name, investor_type, is_published)")
      .eq("ticker", sym)
      .eq("is_published", true);

    const out = new Map<string, { slug: string; name: string; type: InvestorType }>();
    for (const row of manual ?? []) {
      const inv = (row as { investor?: { slug?: string; name?: string; investor_type?: InvestorType; is_published?: boolean } })
        .investor;
      if (!inv?.slug || !inv?.name || inv.is_published !== true) continue;
      out.set(inv.slug, { slug: inv.slug, name: inv.name, type: inv.investor_type ?? "fund" });
    }

    const { data: security } = await supabase
      .from("securities")
      .select("id")
      .eq("ticker", sym)
      .maybeSingle();
    const { data: period } = await supabase
      .from("reporting_periods")
      .select("id")
      .eq("is_latest", true)
      .maybeSingle();

    if (security?.id && period?.id) {
      const { data: holdings } = await supabase
        .from("holdings")
        .select("investor:investors(slug, name, investor_type, is_published)")
        .eq("security_id", security.id)
        .eq("period_id", period.id);
      for (const row of holdings ?? []) {
        const raw = (row as { investor?: { slug?: string; name?: string; investor_type?: InvestorType; is_published?: boolean } | { slug?: string; name?: string; investor_type?: InvestorType; is_published?: boolean }[] })
          .investor;
        const inv = Array.isArray(raw) ? raw[0] : raw;
        if (!inv?.slug || !inv?.name || inv.is_published !== true) continue;
        out.set(inv.slug, { slug: inv.slug, name: inv.name, type: inv.investor_type ?? "fund" });
      }
    }

    return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
);

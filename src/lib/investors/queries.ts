import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeTicker } from "@/lib/polygon";
import { readServiceRoleKey, readSupabaseAnonKey, readSupabaseUrl } from "@/lib/submission-supabase";
import type {
  InvestorDetailModel,
  InvestorListItem,
  InvestorPosition,
  InvestorProfile,
  InvestorType,
} from "@/lib/investors/types";
import { isTrackedInvestorSlug } from "@/lib/investors/tracked-roster";

export const INVESTORS_LIST_CACHE_TAG = "investors-list";

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
  context_note: string | null;
  sort_order: number | null;
  is_published: boolean | null;
};

type InvestorListRow = Pick<
  InvestorRow,
  | "id"
  | "slug"
  | "name"
  | "investor_type"
  | "title_role"
  | "photo_url"
  | "focus_note"
  | "sort_order"
> & { updated_at: string | null };

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
  google_sheet_synced?: boolean;
  created_at: string;
  updated_at: string;
};

type InvestorsClientMode = "service_role" | "anon" | "none";

const INVESTOR_SELECT =
  "id, slug, name, investor_type, title_role, bio, photo_url, website, website_url, cik, focus_note, context_note, sort_order, is_published";

const INVESTOR_LIST_SELECT =
  "id, slug, name, investor_type, title_role, photo_url, focus_note, sort_order, updated_at";

function getInvestorsClient(): {
  client: SupabaseClient | null;
  mode: InvestorsClientMode;
  urlHost: string | null;
} {
  const url = readSupabaseUrl();
  const urlHost = url ? new URL(url).host : null;
  if (!url) return { client: null, mode: "none", urlHost };
  const serviceKey = readServiceRoleKey();
  if (serviceKey) {
    return {
      client: createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      mode: "service_role",
      urlHost,
    };
  }
  const anonKey = readSupabaseAnonKey();
  if (!anonKey) return { client: null, mode: "none", urlHost };
  return {
    client: createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    mode: "anon",
    urlHost,
  };
}

function getAnonClient() {
  return getInvestorsClient().client;
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
    contextNote: row.context_note,
    sortOrder: row.sort_order ?? 100,
    isPublished: row.is_published ?? false,
  };
}

function mapListInvestor(row: InvestorListRow): InvestorProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.investor_type ?? "fund",
    titleRole: row.title_role,
    bio: null,
    photoUrl: row.photo_url,
    website: null,
    cik: null,
    focusNote: row.focus_note,
    contextNote: null,
    sortOrder: row.sort_order ?? 100,
    isPublished: true,
  };
}


function isPlaceholderPositionText(...parts: Array<string | null | undefined>): boolean {
  const hay = parts.filter(Boolean).join(" ").toUpperCase();
  return hay.includes("PLACEHOLDER");
}

function dedupePositionsByTicker(positions: InvestorPosition[]): InvestorPosition[] {
  const seen = new Set<string>();
  const out: InvestorPosition[] = [];
  for (const position of positions) {
    const key = position.ticker.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(position);
  }
  return out;
}

function mapManualPosition(row: PositionRow): InvestorPosition | null {
  if (row.google_sheet_synced === false) return null;
  if (isPlaceholderPositionText(row.detail, row.source_detail, row.why_interesting)) return null;

  const clean = (value: string | null): string | null => {
    if (!value) return value;
    return value
      .replace(/\s*\(research draft\)\s*/gi, " ")
      .replace(/\s*[-\u2014]\s*verify[^.]*before publish\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  return {
    id: row.id,
    investorId: row.investor_id,
    ticker: normalizeTicker(row.ticker),
    companyName: row.company_name,
    positionType: row.position_type,
    detail: clean(row.detail) ?? "",
    approxSize: row.approx_size,
    sourceType: row.source_type,
    sourceDetail: clean(row.source_detail) ?? "",
    asOfDate: row.as_of_date,
    whyInteresting: clean(row.why_interesting),
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isAuto13f: false,
  };
}

async function loadPublishedInvestorsListSorted(): Promise<InvestorListItem[]> {
  const investors = await loadPublishedInvestorsListRows();
  return [...investors].sort((a, b) => {
    const aTs = a.updatedAt ?? "";
    const bTs = b.updatedAt ?? "";
    if (aTs !== bTs) return bTs.localeCompare(aTs);
    return a.name.localeCompare(b.name);
  });
}

async function loadPublishedInvestorsListRows(): Promise<InvestorListItem[]> {
  const supabase = getAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("investors")
    .select(INVESTOR_LIST_SELECT)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[investors] list query failed", error);
    return [];
  }

  const rows = (data ?? []) as InvestorListRow[];
  const investors = rows.map((row) => ({
    ...mapListInvestor(row),
    updatedAt: row.updated_at ?? "",
  }));
  if (investors.length === 0) return [];

  const ids = investors.map((i) => i.id);

  const { data: sheetRows, error: sheetError } = await supabase
    .from("investor_positions")
    .select("investor_id, ticker, detail, source_detail, why_interesting")
    .in("investor_id", ids)
    .eq("is_published", true)
    .eq("google_sheet_synced", true);

  if (sheetError) {
    console.error("[investors] sheet position counts query failed", sheetError);
  }

  const sheetCountById = new Map<string, number>();
  const seenTickerByInvestor = new Map<string, Set<string>>();
  for (const row of sheetRows ?? []) {
    const investorId = (row as { investor_id: string }).investor_id;
    const ticker = normalizeTicker((row as { ticker: string }).ticker);
    if (
      isPlaceholderPositionText(
        (row as { detail?: string }).detail,
        (row as { source_detail?: string }).source_detail,
        (row as { why_interesting?: string | null }).why_interesting,
      )
    ) {
      continue;
    }
    const seen = seenTickerByInvestor.get(investorId) ?? new Set<string>();
    if (seen.has(ticker)) continue;
    seen.add(ticker);
    seenTickerByInvestor.set(investorId, seen);
    sheetCountById.set(investorId, (sheetCountById.get(investorId) ?? 0) + 1);
  }

  return investors
    .filter((investor) => isTrackedInvestorSlug(investor.slug))
    .map((investor) => {
    const sheetPositionCount = sheetCountById.get(investor.id) ?? 0;
    return {
      ...investor,
      manualPositionCount: sheetPositionCount,
      auto13fPositionCount: 0,
      positionCount: sheetPositionCount,
    };
  });
}

const loadPublishedInvestorsListCached = unstable_cache(
  loadPublishedInvestorsListSorted,
  ["investors-list-published-v6-sheet-only"],
  { revalidate: 3600, tags: [INVESTORS_LIST_CACHE_TAG] },
);

export async function getPublishedInvestorsList(): Promise<InvestorListItem[]> {
  return loadPublishedInvestorsListCached();
}

/** @deprecated List is pre-sorted by most recent portfolio update. */
export async function getPublishedInvestors(): Promise<InvestorListItem[]> {
  return getPublishedInvestorsList();
}

async function loadInvestorDetail(slug: string): Promise<InvestorDetailModel | null> {
  if (!isTrackedInvestorSlug(slug)) return null;

  const supabase = getAnonClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("investors")
    .select(INVESTOR_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const investor = mapInvestor(data as InvestorRow);

  const { data: manualRaw } = await supabase
    .from("investor_positions")
    .select(
      "id, investor_id, ticker, company_name, position_type, detail, approx_size, source_type, source_detail, as_of_date, why_interesting, is_published, google_sheet_synced, created_at, updated_at",
    )
    .eq("investor_id", investor.id)
    .eq("is_published", true)
    .eq("google_sheet_synced", true)
    .order("as_of_date", { ascending: false });
  const manualPositions = dedupePositionsByTicker(
    ((manualRaw ?? []) as PositionRow[])
      .map(mapManualPosition)
      .filter((row): row is InvestorPosition => row != null),
  );

  return {
    investor,
    positions: manualPositions,
    manualPositionCount: manualPositions.length,
    auto13fPositionCount: 0,
  };
}

export async function getInvestorDetail(slug: string): Promise<InvestorDetailModel | null> {
  const normalized = slug.trim().toLowerCase();
  return unstable_cache(
    () => loadInvestorDetail(normalized),
    ["investor-detail-sheet-only", normalized],
    { revalidate: 3600, tags: [INVESTORS_LIST_CACHE_TAG, `investor-${normalized}`] },
  )();
}

export const getPublishedInvestorsForTicker = cache(
  async (ticker: string): Promise<Array<{ slug: string; name: string; type: InvestorType }>> => {
    const supabase = getAnonClient();
    if (!supabase) return [];
    const sym = normalizeTicker(ticker);

    const { data: manual } = await supabase
      .from("investor_positions")
      .select("investor_id, investor:investors(slug, name, investor_type, is_published)")
      .eq("ticker", sym)
      .eq("is_published", true)
      .eq("google_sheet_synced", true);

    const out = new Map<string, { slug: string; name: string; type: InvestorType }>();
    for (const row of manual ?? []) {
      const inv = (row as { investor?: { slug?: string; name?: string; investor_type?: InvestorType; is_published?: boolean } })
        .investor;
      if (!inv?.slug || !inv?.name || inv.is_published !== true) continue;
      out.set(inv.slug, { slug: inv.slug, name: inv.name, type: inv.investor_type ?? "fund" });
    }

    return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
);

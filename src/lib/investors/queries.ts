import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeTicker } from "@/lib/polygon";
import { readServiceRoleKey, readSupabaseAnonKey, readSupabaseUrl } from "@/lib/submission-supabase";
import {
  getCsvInvestorBySlug,
  getInvestorPositions,
  getInvestors,
  INVESTOR_NEEDS_DATA,
  slugFromInvestorName,
  type CsvInvestorPosition,
} from "@/lib/investors/csv-data";
import type {
  InvestorDetailModel,
  InvestorListItem,
  InvestorPosition,
  InvestorProfile,
  InvestorType,
} from "@/lib/investors/types";
import { isTrackedInvestorSlug, normalizeTrackedInvestorSlug } from "@/lib/investors/tracked-roster";

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

function mapInvestor(row: InvestorRow, csvProfile?: ReturnType<typeof getCsvInvestorBySlug>): InvestorProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.investor_type ?? "fund",
    titleRole: row.title_role,
    bio: csvProfile?.bioLong ?? row.bio,
    bioShort: csvProfile?.bioShort ?? INVESTOR_NEEDS_DATA,
    bioLong: csvProfile?.bioLong ?? INVESTOR_NEEDS_DATA,
    xHandle: csvProfile?.xHandle ?? INVESTOR_NEEDS_DATA,
    photoUrl: csvProfile?.photoPath ?? row.photo_url,
    website: csvProfile ? csvProfile.website : row.website ?? row.website_url ?? INVESTOR_NEEDS_DATA,
    cik: row.cik,
    focusNote: row.focus_note,
    contextNote: row.context_note,
    sortOrder: row.sort_order ?? 100,
    isPublished: row.is_published ?? false,
  };
}

function mapListInvestor(row: InvestorListRow, csvProfile?: ReturnType<typeof getCsvInvestorBySlug>): InvestorProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.investor_type ?? "fund",
    titleRole: row.title_role,
    bio: null,
    bioShort: csvProfile?.bioShort ?? INVESTOR_NEEDS_DATA,
    bioLong: csvProfile?.bioLong ?? INVESTOR_NEEDS_DATA,
    xHandle: csvProfile?.xHandle ?? INVESTOR_NEEDS_DATA,
    photoUrl: csvProfile?.photoPath ?? row.photo_url,
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

function positionId(row: CsvInvestorPosition): string {
  return `csv-${row.investorSlug}-${row.ticker}-${row.sourceType}-${row.sourceDetail}-${row.asOfDate}`;
}

function mapCsvPosition(row: CsvInvestorPosition, investorId: string): InvestorPosition | null {
  if (isPlaceholderPositionText(row.detail, row.sourceDetail)) return null;

  const now = "1970-01-01T00:00:00.000Z";
  return {
    id: positionId(row),
    investorId,
    ticker: row.ticker,
    companyName: row.companyName,
    positionType: row.positionType,
    detail: row.detail,
    approxSize: null,
    sourceType: row.sourceType,
    sourceDetail: row.sourceDetail,
    asOfDate: row.asOfDate,
    whyInteresting: null,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
    isAuto13f: false,
  };
}

function loadCsvPositionsBySlug(): Map<string, CsvInvestorPosition[]> {
  const bySlug = new Map<string, CsvInvestorPosition[]>();
  for (const row of getInvestorPositions()) {
    const slug = normalizeTrackedInvestorSlug(row.investorSlug);
    if (!isTrackedInvestorSlug(slug)) continue;
    const list = bySlug.get(slug) ?? [];
    list.push({ ...row, investorSlug: slug });
    bySlug.set(slug, list);
  }
  return bySlug;
}

function latestAsOfDate(rows: CsvInvestorPosition[]): string {
  return rows.reduce((max, row) => (row.asOfDate > max ? row.asOfDate : max), "");
}

function countDistinctTickers(rows: CsvInvestorPosition[]): number {
  const seen = new Set<string>();
  for (const row of rows) {
    if (isPlaceholderPositionText(row.detail, row.sourceDetail)) continue;
    seen.add(row.ticker.toUpperCase());
  }
  return seen.size;
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

  const csvBySlug = loadCsvPositionsBySlug();
  const rows = (data ?? []) as InvestorListRow[];

  return rows
    .map((row) => {
      const csvProfile = getCsvInvestorBySlug(row.slug);
      return mapListInvestor(row, csvProfile);
    })
    .filter((investor) => isTrackedInvestorSlug(investor.slug))
    .map((investor) => {
      const csvRows = csvBySlug.get(investor.slug) ?? [];
      const sheetPositionCount = countDistinctTickers(csvRows);
      const csvUpdated = latestAsOfDate(csvRows);
      return {
        ...investor,
        bioShort: investor.bioShort,
        manualPositionCount: sheetPositionCount,
        auto13fPositionCount: 0,
        positionCount: sheetPositionCount,
        updatedAt: csvUpdated || investor.id,
      };
    });
}

const loadPublishedInvestorsListCached = unstable_cache(
  loadPublishedInvestorsListSorted,
  ["investors-list-published-v9-csv-only"],
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
  const normalized = normalizeTrackedInvestorSlug(slug);
  if (!isTrackedInvestorSlug(normalized)) return null;

  const supabase = getAnonClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("investors")
    .select(INVESTOR_SELECT)
    .eq("slug", normalized)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const csvProfile = getCsvInvestorBySlug(normalized);
  const investor = mapInvestor(data as InvestorRow, csvProfile);

  const csvRows = loadCsvPositionsBySlug().get(normalized) ?? [];
  const manualPositions = dedupePositionsByTicker(
    csvRows
      .map((row) => mapCsvPosition(row, investor.id))
      .filter((row): row is InvestorPosition => row != null)
      .sort((a, b) => b.asOfDate.localeCompare(a.asOfDate)),
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
    ["investor-detail-csv-v3-needs-data", normalized],
    { revalidate: 3600, tags: [INVESTORS_LIST_CACHE_TAG, `investor-${normalized}`] },
  )();
}

export const getPublishedInvestorsForTicker = cache(
  async (ticker: string): Promise<Array<{ slug: string; name: string; type: InvestorType }>> => {
    const sym = normalizeTicker(ticker);
    const out = new Map<string, { slug: string; name: string; type: InvestorType }>();

    for (const row of getInvestorPositions()) {
      if (row.ticker !== sym) continue;
      const slug = normalizeTrackedInvestorSlug(row.investorSlug);
      if (!isTrackedInvestorSlug(slug)) continue;
      if (isPlaceholderPositionText(row.detail, row.sourceDetail)) continue;
      out.set(slug, { slug, name: row.investor, type: "individual" });
    }

    return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
);

/** Resolve CSV investor name to tracked slug (for diagnostics). */
export function investorNameToSlug(name: string): string {
  return slugFromInvestorName(name);
}

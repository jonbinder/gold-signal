import { unstable_cache } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeTicker } from "@/lib/polygon";
import { readServiceRoleKey, readSupabaseAnonKey, readSupabaseUrl } from "@/lib/submission-supabase";
import { isTrackedInvestorSlug } from "@/lib/investors/tracked-roster";

export type SheetStockRow = {
  ticker: string;
  companyName: string;
  holders: Array<{ slug: string; name: string }>;
};

function getClient(): SupabaseClient | null {
  const url = readSupabaseUrl();
  if (!url) return null;
  const serviceKey = readServiceRoleKey();
  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  const anonKey = readSupabaseAnonKey();
  if (!anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isPlaceholderPositionText(...parts: Array<string | null | undefined>): boolean {
  const hay = parts.filter(Boolean).join(" ").toUpperCase();
  return hay.includes("PLACEHOLDER");
}

async function loadSheetSyncedStocks(): Promise<SheetStockRow[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("investor_positions")
    .select("ticker, company_name, detail, source_detail, why_interesting, investor:investors(slug, name, is_published)")
    .eq("is_published", true)
    .eq("google_sheet_synced", true);

  if (error) {
    console.error("[stocks] sheet positions query failed", error);
    return [];
  }

  const byTicker = new Map<string, { companyName: string; holders: Map<string, string> }>();

  for (const row of data ?? []) {
    const inv = (row as {
      investor?: { slug?: string; name?: string; is_published?: boolean };
    }).investor;
    if (!inv?.slug || !inv?.name || inv.is_published !== true) continue;
    if (!isTrackedInvestorSlug(inv.slug)) continue;

    if (
      isPlaceholderPositionText(
        (row as { detail?: string }).detail,
        (row as { source_detail?: string }).source_detail,
        (row as { why_interesting?: string | null }).why_interesting,
      )
    ) {
      continue;
    }

    const ticker = normalizeTicker((row as { ticker: string }).ticker);
    if (!ticker) continue;

    const companyName =
      (row as { company_name?: string }).company_name?.trim() || ticker;
    const entry = byTicker.get(ticker) ?? { companyName, holders: new Map<string, string>() };
    if (!entry.companyName || entry.companyName === ticker) entry.companyName = companyName;
    entry.holders.set(inv.slug, inv.name);
    byTicker.set(ticker, entry);
  }

  return [...byTicker.entries()]
    .map(([ticker, { companyName, holders }]) => ({
      ticker,
      companyName,
      holders: [...holders.entries()]
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
}

const loadSheetSyncedStocksCached = unstable_cache(
  loadSheetSyncedStocks,
  ["sheet-synced-stocks-v1"],
  { revalidate: 3600 },
);

export async function getSheetSyncedStocks(): Promise<SheetStockRow[]> {
  return loadSheetSyncedStocksCached();
}

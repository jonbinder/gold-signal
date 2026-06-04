import type { SupabaseClient } from "@supabase/supabase-js";
import { readInvestorPositionsSheet, readSheetEnvConfig } from "@/lib/google-sheets/read-positions-tab";
import type { PositionType } from "@/lib/investors/types";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

const REQUIRED_HEADERS = [
  "investor",
  "ticker",
  "position_type",
  "detail",
  "source_type",
  "source_detail",
  "as_of_date",
] as const;

const OPTIONAL_HEADERS = ["size", "source_url", "published"] as const;

/** Sheet header synonyms → canonical column name */
const HEADER_SYNONYMS: Record<string, (typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number]> = {
  date: "as_of_date",
  as_of: "as_of_date",
  pub: "published",
};

const POSITION_TYPE_MAP: Record<string, PositionType> = {
  stake: "stake_filing",
  stake_filing: "stake_filing",
  insider_form4: "insider_form4",
  insider: "insider_form4",
  form4: "insider_form4",
  fund_holding: "fund_holding",
  fund: "fund_holding",
  public_statement: "public_statement",
  statement: "public_statement",
  other: "other_disclosure",
  other_disclosure: "other_disclosure",
};

export type InvestorSheetSyncResult = {
  ok: boolean;
  rowsRead: number;
  dataRows: number;
  upserted: number;
  deleted: number;
  investorsCreated: number;
  skipped: Array<{ row: number; reason: string }>;
  touchedSlugs: string[];
  /** False when migration 022 columns are missing (upserts still work). */
  sheetRowTracking?: boolean;
  error?: string;
};

type InvestorRow = { id: string; slug: string; name: string };

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "investor";
}

function positionKey(
  investorId: string,
  ticker: string,
  sourceType: string,
  sourceDetail: string,
  asOfDate: string,
): string {
  return `${investorId}|${ticker}|${sourceType}|${sourceDetail}|${asOfDate}`;
}

function parsePublished(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (!v) return true;
  if (v === "false" || v === "no" || v === "0" || v === "n") return false;
  return true;
}

function parseAsOfDate(raw: string): string | null {
  const t = raw.trim();
  const full = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (full) {
    return `${full[1]}-${full[2].padStart(2, "0")}-${full[3].padStart(2, "0")}`;
  }
  const ym = t.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) return `${ym[1]}-${ym[2].padStart(2, "0")}-01`;
  return null;
}

function mapPositionType(raw: string): PositionType | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return POSITION_TYPE_MAP[key] ?? null;
}

function headerIndexMap(headerRow: string[]): { col: Map<string, number> } | { missing: string[] } {
  const col = new Map<string, number>();
  for (let i = 0; i < headerRow.length; i++) {
    const raw = headerRow[i]?.trim().toLowerCase();
    if (!raw) continue;
    const canonical = HEADER_SYNONYMS[raw] ?? raw;
    if (!col.has(canonical)) col.set(canonical, i);
  }
  const missing = REQUIRED_HEADERS.filter((h) => !col.has(h));
  if (missing.length > 0) return { missing: [...missing] };
  return { col };
}

function cell(row: string[], col: Map<string, number>, name: string): string {
  const idx = col.get(name);
  if (idx == null) return "";
  return (row[idx] ?? "").trim();
}

async function loadInvestorsByName(supabase: SupabaseClient): Promise<Map<string, InvestorRow>> {
  const { data, error } = await supabase.from("investors").select("id, slug, name");
  if (error) throw new Error(`investors load failed: ${error.message}`);
  const map = new Map<string, InvestorRow>();
  for (const row of data ?? []) {
    if (!row.id || !row.name) continue;
    map.set(normalizeName(row.name), {
      id: row.id as string,
      slug: (row.slug as string) ?? slugFromName(row.name as string),
      name: row.name as string,
    });
  }
  return map;
}

async function ensureUniqueSlug(supabase: SupabaseClient, base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (n < 50) {
    const { data } = await supabase.from("investors").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

async function resolveOrCreateInvestor(
  supabase: SupabaseClient,
  displayName: string,
  byName: Map<string, InvestorRow>,
): Promise<{ investor: InvestorRow; created: boolean }> {
  const key = normalizeName(displayName);
  const existing = byName.get(key);
  if (existing) return { investor: existing, created: false };

  const slug = await ensureUniqueSlug(supabase, slugFromName(displayName));
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("investors")
    .insert({
      slug,
      name: displayName.trim(),
      investor_type: "individual",
      is_published: true,
      needs_review: false,
      is_active: true,
      sort_order: 200,
      updated_at: now,
    })
    .select("id, slug, name")
    .single();

  if (error || !data?.id) {
    throw new Error(`create investor "${displayName}": ${error?.message ?? "unknown"}`);
  }

  const investor: InvestorRow = {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
  };
  byName.set(key, investor);
  return { investor, created: true };
}

function companyNameForTicker(ticker: string, stockNames: Map<string, string>): string {
  return stockNames.get(ticker) ?? ticker;
}

function isMissingSheetSyncColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    /google_sheet_synced/i.test(msg) ||
    (/source_url/i.test(msg) && /schema cache|does not exist|could not find/i.test(msg))
  );
}

type PositionPayload = {
  investor_id: string;
  ticker: string;
  company_name: string;
  position_type: PositionType;
  detail: string;
  approx_size: string | null;
  source_type: string;
  source_detail: string;
  source_url: string | null;
  as_of_date: string;
  why_interesting: null;
  is_published: boolean;
  needs_review: boolean;
  google_sheet_synced?: boolean;
  updated_at: string;
};

async function upsertSheetPosition(
  supabase: SupabaseClient,
  payload: PositionPayload,
  existingId: string | undefined,
): Promise<{ ok: true; tracksSheetRows: boolean } | { ok: false; message: string }> {
  let tracksSheetRows = true;

  const run = async (row: PositionPayload | Omit<PositionPayload, "google_sheet_synced" | "source_url">) =>
    existingId
      ? supabase.from("investor_positions").update(row).eq("id", existingId)
      : supabase.from("investor_positions").insert(row);

  let { error } = await run(payload);
  if (error && isMissingSheetSyncColumn(error)) {
    tracksSheetRows = false;
    const { google_sheet_synced: _g, source_url: _u, ...rest } = payload;
    ({ error } = await run(rest));
  }

  if (error) return { ok: false, message: error.message };
  return { ok: true, tracksSheetRows };
}

export async function syncInvestorPositionsFromGoogleSheet(
  supabase: SupabaseClient,
): Promise<InvestorSheetSyncResult> {
  const skipped: Array<{ row: number; reason: string }> = [];
  const config = readSheetEnvConfig();
  if (!config) {
    return {
      ok: false,
      rowsRead: 0,
      dataRows: 0,
      upserted: 0,
      deleted: 0,
      investorsCreated: 0,
      skipped: [],
      touchedSlugs: [],
      error: "Google Sheets env not configured (GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY)",
    };
  }

  try {
    const values = await readInvestorPositionsSheet(config);
    if (values.length === 0) {
      return {
        ok: true,
        rowsRead: 0,
        dataRows: 0,
        upserted: 0,
        deleted: 0,
        investorsCreated: 0,
        skipped: [],
        touchedSlugs: [],
      };
    }

    const headerResult = headerIndexMap(values[0] ?? []);
    if ("missing" in headerResult) {
      const found = (values[0] ?? []).map((c) => c.trim()).filter(Boolean);
      return {
        ok: false,
        rowsRead: values.length,
        dataRows: 0,
        upserted: 0,
        deleted: 0,
        investorsCreated: 0,
        skipped: [
          {
            row: 1,
            reason: `Missing columns: ${headerResult.missing.join(", ")}. Found: ${found.join(" | ") || "(empty)"}`,
          },
        ],
        touchedSlugs: [],
        error: "Invalid sheet headers",
      };
    }
    const col = headerResult.col;

    const byName = await loadInvestorsByName(supabase);
    const stockNames = new Map(
      loadTrackedStocksSync().map((s) => [s.ticker.toUpperCase(), s.name]),
    );

    const syncedKeys = new Set<string>();
    const touchedInvestorIds = new Set<string>();
    const touchedSlugs = new Set<string>();
    let upserted = 0;
    let investorsCreated = 0;
    let deleted = 0;
    let sheetRowTracking = true;
    const now = new Date().toISOString();

    for (let i = 1; i < values.length; i++) {
      const rowNum = i + 1;
      const row = values[i] ?? [];
      const allBlank = row.every((c) => !String(c ?? "").trim());
      if (allBlank) continue;

      const investorName = cell(row, col, "investor");
      const tickerRaw = cell(row, col, "ticker");
      const positionTypeRaw = cell(row, col, "position_type");
      const detail = cell(row, col, "detail");
      const size = cell(row, col, "size");
      const sourceType = cell(row, col, "source_type");
      const sourceDetail = cell(row, col, "source_detail");
      const sourceUrl = cell(row, col, "source_url") || null;
      const asOfRaw = cell(row, col, "as_of_date");
      const publishedRaw = cell(row, col, "published");

      if (!investorName) {
        skipped.push({ row: rowNum, reason: "missing investor" });
        continue;
      }
      if (!tickerRaw) {
        skipped.push({ row: rowNum, reason: "missing ticker" });
        continue;
      }
      if (!sourceType) {
        skipped.push({ row: rowNum, reason: "missing source_type" });
        continue;
      }
      if (!sourceDetail) {
        skipped.push({ row: rowNum, reason: "missing source_detail" });
        continue;
      }
      if (!asOfRaw) {
        skipped.push({ row: rowNum, reason: "missing as_of_date" });
        continue;
      }

      const asOfDate = parseAsOfDate(asOfRaw);
      if (!asOfDate) {
        skipped.push({ row: rowNum, reason: `invalid as_of_date "${asOfRaw}"` });
        continue;
      }

      const positionType = mapPositionType(positionTypeRaw);
      if (!positionType) {
        skipped.push({
          row: rowNum,
          reason: `invalid position_type "${positionTypeRaw}"`,
        });
        continue;
      }

      if (!detail) {
        skipped.push({ row: rowNum, reason: "missing detail" });
        continue;
      }

      const ticker = tickerRaw.toUpperCase().replace(/^US:/, "");
      let investor: InvestorRow;
      try {
        const resolved = await resolveOrCreateInvestor(supabase, investorName, byName);
        investor = resolved.investor;
        if (resolved.created) investorsCreated += 1;
      } catch (err) {
        skipped.push({
          row: rowNum,
          reason: err instanceof Error ? err.message : "investor create failed",
        });
        continue;
      }

      touchedInvestorIds.add(investor.id);
      touchedSlugs.add(investor.slug);

      const payload = {
        investor_id: investor.id,
        ticker,
        company_name: companyNameForTicker(ticker, stockNames),
        position_type: positionType,
        detail,
        approx_size: size || null,
        source_type: sourceType,
        source_detail: sourceDetail,
        source_url: sourceUrl,
        as_of_date: asOfDate,
        why_interesting: null,
        is_published: parsePublished(publishedRaw),
        needs_review: false,
        google_sheet_synced: true,
        updated_at: now,
      };

      const { data: existing } = await supabase
        .from("investor_positions")
        .select("id")
        .eq("investor_id", investor.id)
        .eq("ticker", ticker)
        .eq("source_type", sourceType)
        .eq("source_detail", sourceDetail)
        .eq("as_of_date", asOfDate)
        .maybeSingle();

      const write = await upsertSheetPosition(supabase, payload, existing?.id as string | undefined);
      if (!write.ok) {
        skipped.push({ row: rowNum, reason: `upsert failed: ${write.message}` });
        continue;
      }
      if (!write.tracksSheetRows) sheetRowTracking = false;

      syncedKeys.add(positionKey(investor.id, ticker, sourceType, sourceDetail, asOfDate));
      upserted += 1;
    }

    if (sheetRowTracking && touchedInvestorIds.size > 0) {
      const { data: managed } = await supabase
        .from("investor_positions")
        .select("id, investor_id, ticker, source_type, source_detail, as_of_date")
        .eq("google_sheet_synced", true)
        .in("investor_id", [...touchedInvestorIds]);

      for (const pos of managed ?? []) {
        const key = positionKey(
          pos.investor_id as string,
          (pos.ticker as string).toUpperCase(),
          pos.source_type as string,
          pos.source_detail as string,
          pos.as_of_date as string,
        );
        if (!syncedKeys.has(key)) {
          const { error } = await supabase.from("investor_positions").delete().eq("id", pos.id);
          if (!error) deleted += 1;
        }
      }
    }

    const dataRows = values.length - 1;
    console.info("[investor-sheet-sync] complete", {
      rowsRead: values.length,
      dataRows,
      upserted,
      deleted,
      investorsCreated,
      skipped: skipped.length,
      sheetRowTracking,
    });

    return {
      ok: true,
      rowsRead: values.length,
      dataRows,
      upserted,
      deleted,
      investorsCreated,
      skipped,
      touchedSlugs: [...touchedSlugs],
      sheetRowTracking,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sheet sync failed";
    console.error("[investor-sheet-sync] error", message);
    return {
      ok: false,
      rowsRead: 0,
      dataRows: 0,
      upserted: 0,
      deleted: 0,
      investorsCreated: 0,
      skipped,
      touchedSlugs: [],
      error: message,
    };
  }
}

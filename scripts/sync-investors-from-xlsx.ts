/**
 * Reads data/GS-Investors.xlsx and writes public/data/investors.json.
 * When Supabase service role is configured, replaces investor_positions from the workbook only.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import {
  getInvestors as getSheetInvestors,
  INVESTOR_NEEDS_DATA,
  type CsvInvestor,
  type CsvInvestorPosition,
} from "../src/lib/investors/csv-data";
import {
  isTrackedInvestorSlug,
  normalizeTrackedInvestorSlug,
} from "../src/lib/investors/tracked-roster";
import { getSupabaseServiceRole } from "../src/lib/supabase/service-role";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const ROOT = process.cwd();
const XLSX_PATH = path.join(ROOT, "data", "GS-Investors.xlsx");
const JSON_PATH = path.join(ROOT, "public", "data", "investors.json");

export type InvestorHolding = {
  rank: number;
  company: string;
  ticker: string;
  weight: number | null;
  notes: string;
};

export type InvestorRecord = {
  slug: string;
  name: string;
  sheetName: string;
  role: string;
  aum: string;
  positionCount: number;
  thesis: string;
  bio: string;
  tickers: string[];
  holdings: InvestorHolding[];
};

export type InvestorsFile = {
  updatedAt: string;
  investors: InvestorRecord[];
};

function parseWeightFromDetail(detail: string): number | null {
  const match = detail.match(/~?\s*([\d.]+)\s*%/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isNaN(n) ? null : n;
}

function formatHoldingNotes(detail: string, sourceType: string, sourceDetail: string): string {
  const parts = [detail, sourceType, sourceDetail].map((p) => p.trim()).filter(Boolean);
  return parts.join(" · ");
}

function isPlaceholderPositionText(...parts: Array<string | null | undefined>): boolean {
  const hay = parts.filter(Boolean).join(" ").toUpperCase();
  return hay.includes("PLACEHOLDER");
}

function sheetInvestorToRecord(inv: CsvInvestor): InvestorRecord {
  const holdings: InvestorHolding[] = inv.holdings.map((h, index) => ({
    rank: index + 1,
    company: h.companyName,
    ticker: h.ticker,
    weight: parseWeightFromDetail(h.detail),
    notes: formatHoldingNotes(h.detail, h.sourceType, h.sourceDetail),
  }));

  const tickers = [
    ...new Set(holdings.map((h) => h.ticker).filter((t) => t.length > 0 && t.length <= 6)),
  ].slice(0, 8);

  const thesis = inv.bioShort === INVESTOR_NEEDS_DATA ? "" : inv.bioShort;
  const bio = inv.bioLong === INVESTOR_NEEDS_DATA ? "" : inv.bioLong;

  return {
    slug: normalizeTrackedInvestorSlug(inv.slug),
    name: inv.name,
    sheetName: inv.name,
    role: "",
    aum: "",
    positionCount: holdings.length,
    thesis,
    bio,
    tickers,
    holdings,
  };
}

export function readInvestorsFromXlsx(): InvestorRecord[] {
  return getSheetInvestors()
    .map(sheetInvestorToRecord)
    .filter((inv) => isTrackedInvestorSlug(inv.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function writeInvestorsJson(investors: InvestorRecord[], filePath = JSON_PATH): void {
  const roster = investors
    .map((inv) => ({
      ...inv,
      slug: normalizeTrackedInvestorSlug(inv.slug),
    }))
    .filter((inv) => isTrackedInvestorSlug(inv.slug));

  const payload: InvestorsFile = {
    updatedAt: new Date().toISOString(),
    investors: roster.sort((a, b) => a.name.localeCompare(b.name)),
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sheetPositionRows(investorId: string, holdings: CsvInvestorPosition[]) {
  const now = new Date().toISOString();
  return holdings
    .filter((row) => !isPlaceholderPositionText(row.detail, row.sourceDetail))
    .map((row) => ({
      investor_id: investorId,
      ticker: row.ticker.trim().toUpperCase(),
      company_name: row.companyName.trim() || row.ticker,
      position_type: row.positionType,
      detail: row.detail,
      approx_size: null,
      source_type: row.sourceType,
      source_detail: row.sourceDetail,
      as_of_date: row.asOfDate,
      why_interesting: null,
      is_published: true,
      needs_review: false,
      google_sheet_synced: true,
      updated_at: now,
    }));
}

async function syncSupabasePositionsFromSheet(sheetInvestors: CsvInvestor[]): Promise<number> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) {
    console.warn("[investors:sync] Skipping Supabase position sync (missing service role env).");
    return 0;
  }

  const { data: investorRows, error: investorError } = await supabase
    .from("investors")
    .select("id, slug");

  if (investorError) {
    throw new Error(`Failed to load investors for position sync: ${investorError.message}`);
  }

  const sheetBySlug = new Map(
    sheetInvestors.map((inv) => [normalizeTrackedInvestorSlug(inv.slug), inv] as const),
  );

  const trackedIds = (investorRows ?? [])
    .filter((row) => isTrackedInvestorSlug(row.slug))
    .map((row) => row.id);

  if (trackedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("investor_positions")
      .delete()
      .in("investor_id", trackedIds);
    if (deleteError) {
      throw new Error(`Failed to clear investor_positions: ${deleteError.message}`);
    }
  }

  let inserted = 0;
  for (const row of investorRows ?? []) {
    const slug = normalizeTrackedInvestorSlug(row.slug);
    if (!isTrackedInvestorSlug(slug)) continue;

    const sheetInvestor = sheetBySlug.get(slug);
    if (!sheetInvestor?.holdings.length) continue;

    const payload = sheetPositionRows(row.id, sheetInvestor.holdings);
    if (payload.length === 0) continue;

    const { error: insertError } = await supabase.from("investor_positions").insert(payload);
    if (insertError) {
      throw new Error(`Failed to insert positions for ${slug}: ${insertError.message}`);
    }
    inserted += payload.length;

    await supabase.from("investors").update({ updated_at: new Date().toISOString() }).eq("id", row.id);
  }

  return inserted;
}

async function main(): Promise<void> {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`Missing ${path.relative(ROOT, XLSX_PATH)}. Add GS-Investors.xlsx under data/.`);
    process.exit(1);
  }

  const sheetInvestors = getSheetInvestors();
  const investors = sheetInvestors
    .map(sheetInvestorToRecord)
    .filter((inv) => isTrackedInvestorSlug(inv.slug))
    .sort((a, b) => a.name.localeCompare(b.name));

  writeInvestorsJson(investors);

  const rowsRead = sheetInvestors.reduce((sum, inv) => sum + inv.holdings.length, 0);
  const rowsInserted = await syncSupabasePositionsFromSheet(sheetInvestors);

  console.log(`Synced ${investors.length} investors → public/data/investors.json`);
  console.log(`[investors:sync] xlsx rows read: ${rowsRead}, supabase rows inserted: ${rowsInserted}`);
}

const isDirectRun = process.argv[1]?.includes("sync-investors-from-xlsx");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

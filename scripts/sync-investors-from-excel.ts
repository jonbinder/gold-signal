/**
 * Reads GoldSignal_Investors.xlsx from the project root and writes public/data/investors.json.
 * One worksheet per investor (plus optional "Investor Index" tab).
 */
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import {
  isTrackedInvestorSlug,
  normalizeTrackedInvestorSlug,
} from "../src/lib/investors/tracked-roster";
import {
  isTrackedInvestorSlug,
  normalizeTrackedInvestorSlug,
} from "../src/lib/investors/tracked-roster";

const ROOT = process.cwd();
const EXCEL_PATH = path.join(ROOT, "GoldSignal_Investors.xlsx");
const JSON_PATH = path.join(ROOT, "public", "data", "investors.json");
const INDEX_SHEET = "📋 Investor Index";

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanTicker(raw: unknown): string {
  const t = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!t || t === "—" || t === "-" || t === "N/A") return "";
  return t.split(".")[0] === t ? t : t;
}

function parseWeight(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[%$,]/g, "").trim());
  return Number.isNaN(n) ? null : n;
}

function rowToArray(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0] ?? "").trim() === "#") return i;
  }
  return -1;
}

function parseHoldings(rows: unknown[][], headerRow: number): InvestorHolding[] {
  const holdings: InvestorHolding[] = [];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const rankRaw = row[0];
    const company = String(row[1] ?? "").trim();
    const ticker = cleanTicker(row[2]);
    const notes = String(row[4] ?? "").trim();

    if (!company && !ticker) continue;

    const rank =
      typeof rankRaw === "number"
        ? rankRaw
        : Number.parseInt(String(rankRaw).trim(), 10);

    if (Number.isNaN(rank)) continue;

    holdings.push({
      rank,
      company,
      ticker,
      weight: parseWeight(row[3]),
      notes,
    });
  }

  return holdings;
}

function extractBio(rows: unknown[][]): string {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const text = String(rows[i][0] ?? "").trim();
    if (text.length > 80 && !text.startsWith("⚠") && !text.includes("Portfolio")) {
      return text;
    }
  }
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const text = String(rows[i][0] ?? "").trim();
    if (text.length > 40 && !text.startsWith("⚠") && text !== "#") {
      return text;
    }
  }
  return "";
}

function extractDisplayName(rows: unknown[][], sheetName: string): string {
  const title = String(rows[0]?.[0] ?? "").trim();
  if (title) {
    return title.split("–")[0].split("-")[0].trim() || sheetName;
  }
  return sheetName;
}

type IndexMeta = {
  name: string;
  role: string;
  aum: string;
  positionCount: number;
  thesis: string;
};

function parseInvestorIndex(wb: XLSX.WorkBook): Map<string, IndexMeta> {
  const map = new Map<string, IndexMeta>();
  const sheet = wb.Sheets[INDEX_SHEET];
  if (!sheet) return map;

  const rows = rowToArray(sheet);
  const headerRow = findHeaderRow(rows);
  if (headerRow < 0) return map;

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[1] ?? "").trim();
    if (!name) continue;

    const positionCount = Number.parseInt(String(row[4] ?? "0"), 10);

    map.set(name.toLowerCase(), {
      name,
      role: String(row[2] ?? "").trim(),
      aum: String(row[3] ?? "").trim(),
      positionCount: Number.isNaN(positionCount) ? 0 : positionCount,
      thesis: String(row[5] ?? "").trim(),
    });
  }

  return map;
}

function matchIndexMeta(sheetName: string, index: Map<string, IndexMeta>): IndexMeta | undefined {
  const key = sheetName.toLowerCase();
  for (const [k, meta] of index) {
    if (k.includes(key) || key.includes(k.split("/")[0].trim())) return meta;
    const first = meta.name.split("/")[0].trim().toLowerCase();
    if (key.includes(first) || first.includes(key)) return meta;
  }
  return undefined;
}

export function readInvestorsFromWorkbook(wb: XLSX.WorkBook): InvestorRecord[] {
  const index = parseInvestorIndex(wb);
  const investors: InvestorRecord[] = [];

  for (const sheetName of wb.SheetNames) {
    if (sheetName === INDEX_SHEET) continue;

    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const rows = rowToArray(sheet);
    const headerRow = findHeaderRow(rows);
    if (headerRow < 0) continue;

    const holdings = parseHoldings(rows, headerRow);
    const meta = matchIndexMeta(sheetName, index);
    const tickers = [
      ...new Set(holdings.map((h) => h.ticker).filter((t) => t.length > 0 && t.length <= 6)),
    ].slice(0, 8);

    const name = meta?.name.split("/")[0].trim() || extractDisplayName(rows, sheetName);

    investors.push({
      slug: normalizeTrackedInvestorSlug(slugify(sheetName)),
      name,
      sheetName,
      role: meta?.role || "",
      aum: meta?.aum || "",
      positionCount: meta?.positionCount || holdings.length,
      thesis: meta?.thesis || "",
      bio: extractBio(rows),
      tickers,
      holdings,
    });
  }

  return investors
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

function main(): void {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Missing ${path.basename(EXCEL_PATH)} in project root.`);
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const investors = readInvestorsFromWorkbook(wb);
  writeInvestorsJson(investors);
  console.log(`Synced ${investors.length} investors → public/data/investors.json`);
}

const isDirectRun = process.argv[1]?.includes("sync-investors-from-excel");
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

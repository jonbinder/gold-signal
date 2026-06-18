import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeTicker } from "@/lib/polygon";
import type { PositionType } from "@/lib/investors/types";

const CSV_PATH = path.join(process.cwd(), "data", "GS-Investors.csv");

const POSITION_TYPE_MAP: Record<string, PositionType> = {
  stake: "stake_filing",
  stake_filing: "stake_filing",
  insider_form4: "insider_form4",
  insider: "insider_form4",
  form4: "insider_form4",
  fund_holding: "fund_holding",
  fund: "fund_holding",
  company_holding: "fund_holding",
  company: "fund_holding",
  public_statement: "public_statement",
  statement: "public_statement",
  other: "other_disclosure",
  other_disclosure: "other_disclosure",
};

export type CsvInvestorPosition = {
  investor: string;
  investorSlug: string;
  ticker: string;
  companyName: string;
  positionType: PositionType;
  detail: string;
  sourceType: string;
  sourceDetail: string;
  asOfDate: string;
};

let cachedRows: CsvInvestorPosition[] | null = null;
let loggedPreview = false;

export function slugFromInvestorName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "investor";
}

function parseAsOfDate(raw: string): string | null {
  const t = raw.trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  const ym = t.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) return `${ym[1]}-${ym[2].padStart(2, "0")}-01`;

  const yearOnly = t.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;

  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function mapPositionType(raw: string): PositionType | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return POSITION_TYPE_MAP[key] ?? null;
}

/** RFC 4180-style CSV row parser (handles quoted commas). */
export function parseCsvText(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i]!;
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else if (ch === "\r") {
      /* skip */
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function logCsvPreview(grid: string[][]): void {
  if (loggedPreview || grid.length === 0) return;
  loggedPreview = true;
  console.info("[gs-investors-csv] headers:", grid[0]);
  if (grid[1]) console.info("[gs-investors-csv] row 1:", grid[1]);
  if (grid[2]) console.info("[gs-investors-csv] row 2:", grid[2]);
}

function loadCsvGrid(): string[][] {
  const raw = readFileSync(CSV_PATH, "utf8");
  const grid = parseCsvText(raw.replace(/^\uFEFF/, ""));
  logCsvPreview(grid);
  return grid;
}

function rowToPosition(cells: string[], col: Map<string, number>): CsvInvestorPosition | null {
  const get = (name: string) => {
    const idx = col.get(name);
    if (idx == null) return "";
    return (cells[idx] ?? "").trim();
  };

  const investor = get("investor");
  const tickerRaw = get("ticker");
  const companyName = get("company_name");
  const positionTypeRaw = get("position_type");
  const detail = get("detail");
  const sourceType = get("source_type");
  const sourceDetail = get("source_detail");
  const asOfRaw = get("date") || get("as_of_date");

  if (!investor || !tickerRaw || !detail || !sourceType || !sourceDetail || !asOfRaw) return null;

  const positionType = mapPositionType(positionTypeRaw);
  if (!positionType) return null;

  const asOfDate = parseAsOfDate(asOfRaw);
  if (!asOfDate) return null;

  return {
    investor,
    investorSlug: slugFromInvestorName(investor),
    ticker: normalizeTicker(tickerRaw.replace(/^US:/, "")),
    companyName: companyName || tickerRaw,
    positionType,
    detail,
    sourceType,
    sourceDetail,
    asOfDate,
  };
}

function buildColumnMap(header: string[]): Map<string, number> {
  const col = new Map<string, number>();
  for (let i = 0; i < header.length; i += 1) {
    const raw = header[i]?.trim().toLowerCase();
    if (!raw) continue;
    const canonical = raw === "date" || raw === "as_of" ? "date" : raw;
    if (!col.has(canonical)) col.set(canonical, i);
  }
  return col;
}

/**
 * Read GS-Investors.csv at build/request time (server only).
 * Column mapping: investor, ticker, company_name, position_type, detail, source_type, source_detail, date.
 */
export function getInvestors(): CsvInvestorPosition[] {
  if (cachedRows) return cachedRows;

  const grid = loadCsvGrid();
  if (grid.length < 2) {
    cachedRows = [];
    return cachedRows;
  }

  const col = buildColumnMap(grid[0] ?? []);
  const rows: CsvInvestorPosition[] = [];

  for (let i = 1; i < grid.length; i += 1) {
    const parsed = rowToPosition(grid[i] ?? [], col);
    if (parsed) rows.push(parsed);
  }

  cachedRows = rows;
  return cachedRows;
}

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { normalizeTicker } from "@/lib/polygon";
import type { PositionType } from "@/lib/investors/types";

const INVESTOR_SHEET_PATH = path.join(process.cwd(), "data", "GS-Investors.xlsx");
const PREFERRED_SHEET_NAMES = ["GS-Investors", "Investors", "investors"];
const PLACEHOLDER_PHOTO = "/investors/placeholder-investor.svg";

export const INVESTOR_NEEDS_DATA = "[ NEEDS DATA ]";

const REQUIRED_SHEET_COLUMNS = [
  "investor",
  "ticker",
  "company_name",
  "position_type",
  "detail",
  "source_type",
  "source_detail",
  "date",
  "bio_short",
  "bio_long",
  "website",
  "x_handle",
] as const;

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

export type CsvInvestor = {
  name: string;
  slug: string;
  bioShort: string;
  bioLong: string;
  website: string;
  xHandle: string;
  photoPath: string;
  holdings: CsvInvestorPosition[];
};

let cachedInvestors: CsvInvestor[] | null = null;
let loggedPreview = false;
let loggedInvestors = false;

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

export function isInvestorNeedsData(value: string): boolean {
  return value.trim() === INVESTOR_NEEDS_DATA;
}

function isEmptyCsvValue(value: string): boolean {
  const t = value.trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  return lower === "none" || lower === "n/a" || lower === "null";
}

function normalizeInvestorField(value: string): string {
  return isEmptyCsvValue(value) ? INVESTOR_NEEDS_DATA : value.trim();
}

function pickFirstNonEmpty(current: string, next: string): string {
  if (!isEmptyCsvValue(current)) return current.trim();
  if (!isEmptyCsvValue(next)) return next.trim();
  return "";
}

export function resolveInvestorPhotoPath(slug: string): string {
  const dirs = [
    { base: path.join(process.cwd(), "public", "investor-photos"), urlPrefix: "/investor-photos" },
    { base: path.join(process.cwd(), "public", "investors"), urlPrefix: "/investors" },
  ];
  const extensions = [".webp", ".jpg", ".jpeg", ".png"];

  for (const { base, urlPrefix } of dirs) {
    for (const ext of extensions) {
      const filePath = path.join(base, `${slug}${ext}`);
      if (existsSync(filePath)) return `${urlPrefix}/${slug}${ext}`;
    }
  }

  return PLACEHOLDER_PHOTO;
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

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).trim();
}

function pickInvestorWorksheetName(sheetNames: string[]): string {
  for (const name of PREFERRED_SHEET_NAMES) {
    if (sheetNames.includes(name)) return name;
  }
  return sheetNames[0] ?? "";
}

function logSheetPreview(grid: string[][]): void {
  if (loggedPreview || grid.length === 0) return;
  loggedPreview = true;
  console.info("[gs-investors-xlsx] headers:", grid[0]);
  if (grid[1]) console.info("[gs-investors-xlsx] row 1:", grid[1]);
  if (grid[2]) console.info("[gs-investors-xlsx] row 2:", grid[2]);
}

function logInvestorSummary(investors: CsvInvestor[]): void {
  if (loggedInvestors) return;
  loggedInvestors = true;
  console.info(
    "[gs-investors-xlsx] parsed investors:",
    investors.map((inv) => ({
      name: inv.name,
      bio_short: inv.bioShort,
      photo: inv.photoPath,
    })),
  );
}

function loadInvestorSheetGrid(): string[][] {
  if (!existsSync(INVESTOR_SHEET_PATH)) {
    throw new Error(`Missing data/GS-Investors.xlsx (expected at ${INVESTOR_SHEET_PATH})`);
  }

  const buffer = readFileSync(INVESTOR_SHEET_PATH);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = pickInvestorWorksheetName(workbook.SheetNames);
  if (!sheetName) {
    throw new Error("GS-Investors.xlsx has no worksheets");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" not found in GS-Investors.xlsx`);
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const grid = rawRows
    .map((row) => (Array.isArray(row) ? row : []).map(cellToString))
    .filter((row) => row.some((cell) => cell.length > 0));

  logSheetPreview(grid);
  return grid;
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

function assertRequiredColumns(col: Map<string, number>): void {
  const missing = REQUIRED_SHEET_COLUMNS.filter((name) => !col.has(name));
  if (missing.length > 0) {
    throw new Error(`GS-Investors.xlsx missing required columns: ${missing.join(", ")}`);
  }
}

function rowGet(cells: string[], col: Map<string, number>, name: string): string {
  const idx = col.get(name);
  if (idx == null) return "";
  return (cells[idx] ?? "").trim();
}

function rowToPosition(cells: string[], col: Map<string, number>, investor: string, investorSlug: string): CsvInvestorPosition | null {
  const tickerRaw = rowGet(cells, col, "ticker");
  const companyName = rowGet(cells, col, "company_name");
  const positionTypeRaw = rowGet(cells, col, "position_type");
  const detail = rowGet(cells, col, "detail");
  const sourceType = rowGet(cells, col, "source_type");
  const sourceDetail = rowGet(cells, col, "source_detail");
  const asOfRaw = rowGet(cells, col, "date");

  if (!tickerRaw || !detail || !sourceType || !sourceDetail || !asOfRaw) return null;

  const positionType = mapPositionType(positionTypeRaw);
  if (!positionType) return null;

  const asOfDate = parseAsOfDate(asOfRaw);
  if (!asOfDate) return null;

  return {
    investor,
    investorSlug,
    ticker: normalizeTicker(tickerRaw.replace(/^US:/, "")),
    companyName: companyName || tickerRaw,
    positionType,
    detail,
    sourceType,
    sourceDetail,
    asOfDate,
  };
}

type InvestorAccumulator = {
  name: string;
  slug: string;
  bioShort: string;
  bioLong: string;
  website: string;
  xHandle: string;
  holdings: CsvInvestorPosition[];
};

function buildInvestorsFromGrid(grid: string[][]): CsvInvestor[] {
  if (grid.length < 2) return [];

  const col = buildColumnMap(grid[0] ?? []);
  assertRequiredColumns(col);

  const byName = new Map<string, InvestorAccumulator>();

  for (let i = 1; i < grid.length; i += 1) {
    const cells = grid[i] ?? [];
    const investorName = rowGet(cells, col, "investor");
    if (!investorName) continue;

    const slug = slugFromInvestorName(investorName);
    const existing = byName.get(investorName) ?? {
      name: investorName,
      slug,
      bioShort: "",
      bioLong: "",
      website: "",
      xHandle: "",
      holdings: [],
    };

    existing.bioShort = pickFirstNonEmpty(existing.bioShort, rowGet(cells, col, "bio_short"));
    existing.bioLong = pickFirstNonEmpty(existing.bioLong, rowGet(cells, col, "bio_long"));
    existing.website = pickFirstNonEmpty(existing.website, rowGet(cells, col, "website"));
    existing.xHandle = pickFirstNonEmpty(existing.xHandle, rowGet(cells, col, "x_handle"));

    const position = rowToPosition(cells, col, investorName, slug);
    if (position) existing.holdings.push(position);

    byName.set(investorName, existing);
  }

  return [...byName.values()].map((acc) => ({
    name: acc.name,
    slug: acc.slug,
    bioShort: normalizeInvestorField(acc.bioShort),
    bioLong: normalizeInvestorField(acc.bioLong),
    website: normalizeInvestorField(acc.website),
    xHandle: normalizeInvestorField(acc.xHandle),
    photoPath: resolveInvestorPhotoPath(acc.slug),
    holdings: acc.holdings,
  }));
}

/**
 * Grouped investors from data/GS-Investors.xlsx (server only).
 * Each investor includes holdings and profile fields from the sheet.
 */
export function getInvestors(): CsvInvestor[] {
  if (cachedInvestors) return cachedInvestors;
  cachedInvestors = buildInvestorsFromGrid(loadInvestorSheetGrid());
  logInvestorSummary(cachedInvestors);
  return cachedInvestors;
}

/** Flat position rows derived from grouped investor sheet rows. */
export function getInvestorPositions(): CsvInvestorPosition[] {
  return getInvestors().flatMap((inv) =>
    inv.holdings.map((row) => ({ ...row, investorSlug: inv.slug })),
  );
}

export function getCsvInvestorBySlug(slug: string): CsvInvestor | undefined {
  const normalized = slug.trim().toLowerCase();
  return getInvestors().find((inv) => inv.slug === normalized);
}

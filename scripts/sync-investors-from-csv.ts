/**
 * Reads data/GS-Investors.csv and writes public/data/investors.json.
 */
import fs from "fs";
import path from "path";
import {
  getInvestors as getCsvInvestors,
  INVESTOR_NEEDS_DATA,
  type CsvInvestor,
} from "../src/lib/investors/csv-data";
import {
  isTrackedInvestorSlug,
  normalizeTrackedInvestorSlug,
} from "../src/lib/investors/tracked-roster";

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, "data", "GS-Investors.csv");
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

function csvInvestorToRecord(inv: CsvInvestor): InvestorRecord {
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

export function readInvestorsFromCsv(): InvestorRecord[] {
  return getCsvInvestors()
    .map(csvInvestorToRecord)
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
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Missing ${path.relative(ROOT, CSV_PATH)}. Add GS-Investors.csv under data/.`);
    process.exit(1);
  }

  const investors = readInvestorsFromCsv();
  writeInvestorsJson(investors);
  console.log(`Synced ${investors.length} investors → public/data/investors.json`);
}

const isDirectRun = process.argv[1]?.includes("sync-investors-from-csv");
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

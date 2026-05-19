/**
 * Reads GoldSignal_Stocks.xlsx from the project root and writes public/data/stocks.json.
 * Run after editing the spreadsheet: npm run stocks:sync
 * Also runs automatically before production builds (prebuild).
 */
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const ROOT = process.cwd();
const EXCEL_PATH = path.join(ROOT, "GoldSignal_Stocks.xlsx");
const JSON_PATH = path.join(ROOT, "public", "data", "stocks.json");
const SHEET_NAME = "Stocks";

export type StockRow = {
  ticker: string;
  company: string;
  sector: string;
  weeklyChange: number;
  signalScore: number;
};

const SAMPLE_STOCKS: StockRow[] = [
  { ticker: "NEM", company: "Newmont Corporation", sector: "Gold Mining", weeklyChange: 2.4, signalScore: 94 },
  { ticker: "FNV", company: "Franco-Nevada Corp", sector: "Royalty & Streaming", weeklyChange: 1.8, signalScore: 91 },
  { ticker: "WPM", company: "Wheaton Precious Metals", sector: "Silver Streaming", weeklyChange: 3.1, signalScore: 89 },
  { ticker: "GOLD", company: "Barrick Gold Corporation", sector: "Gold Mining", weeklyChange: -0.6, signalScore: 87 },
  { ticker: "AEM", company: "Agnico Eagle Mines", sector: "Gold Mining", weeklyChange: 1.2, signalScore: 85 },
  { ticker: "KGC", company: "Kinross Gold", sector: "Gold Mining", weeklyChange: 0.9, signalScore: 83 },
  { ticker: "AG", company: "First Majestic Silver", sector: "Silver Mining", weeklyChange: 4.2, signalScore: 81 },
  { ticker: "PAAS", company: "Pan American Silver", sector: "Silver Mining", weeklyChange: -1.1, signalScore: 78 },
  { ticker: "RGLD", company: "Royal Gold", sector: "Royalty & Streaming", weeklyChange: 0, signalScore: 76 },
  { ticker: "GDX", company: "VanEck Gold Miners ETF", sector: "ETF", weeklyChange: 2.0, signalScore: 72 },
  { ticker: "HL", company: "Hecla Mining", sector: "Silver Mining", weeklyChange: -2.3, signalScore: 58 },
  { ticker: "MUX", company: "McEwen Mining", sector: "Gold Mining", weeklyChange: -3.5, signalScore: 52 },
];

const EXCEL_HEADERS = [
  "Ticker",
  "Company",
  "Sector",
  "Weekly Change (%)",
  "Signal Score",
] as const;

function toKey(header: unknown): string {
  return String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cell(row: Record<string, unknown>, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    const key = toKey(alias);
    const match = Object.entries(row).find(([k]) => toKey(k) === key);
    if (match && match[1] !== "" && match[1] != null) return match[1];
  }
  return undefined;
}

function parseNumber(value: unknown, field: string, rowNum: number): number {
  if (value === null || value === undefined || value === "") {
    throw new Error(`Row ${rowNum}: missing value for "${field}"`);
  }
  const n = typeof value === "number" ? value : Number(String(value).trim().replace(/,/g, ""));
  if (Number.isNaN(n)) {
    throw new Error(`Row ${rowNum}: "${field}" must be a number (got "${value}")`);
  }
  return n;
}

function rowToStock(row: Record<string, unknown>, rowNum: number): StockRow | null {
  const ticker = String(cell(row, "ticker", "symbol") ?? "")
    .trim()
    .toUpperCase();
  if (!ticker || ticker === "TICKER") return null;

  const company = String(cell(row, "company") ?? "").trim();
  const sector = String(cell(row, "sector") ?? "").trim();
  const weeklyChange = parseNumber(
    cell(row, "weekly change", "weeklychange", "weekly change %"),
    "Weekly Change (%)",
    rowNum
  );
  const signalScore = parseNumber(
    cell(row, "signal score", "signalscore", "score"),
    "Signal Score",
    rowNum
  );

  if (signalScore < 1 || signalScore > 100) {
    throw new Error(`Row ${rowNum}: Signal Score must be between 1 and 100 (got ${signalScore})`);
  }

  if (!company || !sector) {
    throw new Error(`Row ${rowNum}: Company and Sector are required for ticker ${ticker}`);
  }

  return { ticker, company, sector, weeklyChange, signalScore };
}

export function stocksToSheetRows(stocks: StockRow[]): (string | number)[][] {
  return [
    [...EXCEL_HEADERS],
    ...stocks.map((s) => [s.ticker, s.company, s.sector, s.weeklyChange, s.signalScore]),
  ];
}

export function writeStocksExcel(stocks: StockRow[], filePath = EXCEL_PATH): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(stocksToSheetRows(stocks));
  ws["!cols"] = [{ wch: 8 }, { wch: 32 }, { wch: 22 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  XLSX.writeFile(wb, filePath);
}

export function readStocksFromExcel(filePath = EXCEL_PATH): StockRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[SHEET_NAME] ?? wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    throw new Error("No worksheet found in GoldSignal_Stocks.xlsx");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const stocks: StockRow[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const stock = rowToStock(row, rowNum);
    if (stock) stocks.push(stock);
  });

  if (stocks.length === 0) {
    throw new Error("No stock rows found. Add data below the header row in GoldSignal_Stocks.xlsx");
  }

  return stocks;
}

export function writeStocksJson(stocks: StockRow[], filePath = JSON_PATH): void {
  const sorted = [...stocks].sort((a, b) => b.signalScore - a.signalScore);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

function loadSeedStocks(): StockRow[] {
  if (fs.existsSync(JSON_PATH)) {
    return JSON.parse(fs.readFileSync(JSON_PATH, "utf8")) as StockRow[];
  }
  return SAMPLE_STOCKS;
}

function ensureExcelExists(): void {
  if (fs.existsSync(EXCEL_PATH)) return;
  const seed = loadSeedStocks();
  writeStocksExcel(seed);
  console.log(`Created ${path.basename(EXCEL_PATH)} with ${seed.length} sample rows.`);
}

function main(): void {
  ensureExcelExists();
  const stocks = readStocksFromExcel();
  writeStocksJson(stocks);
  console.log(`Synced ${stocks.length} stocks → public/data/stocks.json`);
  console.log("Edit GoldSignal_Stocks.xlsx, then run: npm run stocks:sync");
}

const isDirectRun = process.argv[1]?.includes("sync-stocks-from-excel");
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

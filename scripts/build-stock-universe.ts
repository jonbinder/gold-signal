/**
 * Builds data/tracked-stocks.json from ETF holdings CSVs, royalty list, and Polygon SIC search.
 *
 * Manual ETF CSVs (see data/raw/README.md):
 *   data/raw/gdx-holdings.csv, gdxj-holdings.csv, sil-holdings.csv, silj-holdings.csv
 *
 * Usage: npx tsx scripts/build-stock-universe.ts
 * Requires: POLYGON_API_KEY in .env.local (loaded via dotenv if present)
 */

import fs from "fs";
import path from "path";
import { searchReferenceTickersBySic, getTickerDetails, normalizeTicker } from "../src/lib/polygon";
import type { StockCategory, StockSubCategory, TrackedStock, TrackedStocksFile } from "../src/lib/tracked-stocks";

const ROOT = path.join(process.cwd());
const RAW_DIR = path.join(ROOT, "data", "raw");
const OUT_PATH = path.join(ROOT, "data", "tracked-stocks.json");

const ROYALTY_TICKERS = [
  "FNV", "WPM", "RGLD", "SAND", "OR", "TFPM", "MTA", "EMX", "VOXR", "GROY", "ELE", "ABRA", "MMX", "NSR",
] as const;

const ETF_SYMBOLS = new Set(["GDX", "GDXJ", "SIL", "SILJ"]);

const ROYALTY_NAMES: Record<string, string> = {
  FNV: "Franco-Nevada Corporation",
  WPM: "Wheaton Precious Metals Corp.",
  RGLD: "Royal Gold, Inc.",
  SAND: "Sandstorm Gold Ltd.",
  OR: "Osisko Gold Royalties Ltd",
  TFPM: "Triple Flag Precious Metals Corp.",
  MTA: "Metalla Royalty & Streaming Ltd.",
  EMX: "EMX Royalty Corporation",
  VOXR: "Vox Royalty Corp.",
  GROY: "Gold Royalty Corp.",
  ELE: "Elemental Royalty Corporation",
  ABRA: "AbraSilver Resource Corp.",
  MMX: "Metallic Minerals Corp.",
  NSR: "Nomad Royalty Company Ltd.",
};

const DOMAIN_BY_TICKER: Record<string, string> = {
  NEM: "newmont.com",
  GOLD: "barrick.com",
  AEM: "agnicoeagle.com",
  FNV: "franco-nevada.com",
  WPM: "wheatonpm.com",
  RGLD: "royalgold.com",
  KGC: "kinross.com",
  PAAS: "panamericansilver.com",
};

type SourceTag =
  | "royalty"
  | "etf_gdx"
  | "etf_gdxj"
  | "etf_sil"
  | "etf_silj"
  | "polygon_sic_1040"
  | "polygon_sic_1044";

type Draft = {
  ticker: string;
  name: string;
  source: SourceTag;
  marketCap: number | null;
  exchange: string;
  homepageUrl: string | null;
  etfJunior: boolean;
  etfGold: boolean;
  etfSilver: boolean;
};

function loadEnvLocal(): void {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseCsvHoldings(filePath: string, source: SourceTag, flags: Partial<Draft>): Draft[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`[universe] Missing ${path.basename(filePath)} — skip (see data/raw/README.md)`);
    return [];
  }

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/"/g, ""));
  const tickerIdx = cols.findIndex((c) => /^(ticker|symbol|holding|identifier)$/.test(c) || c.includes("ticker"));
  const nameIdx = cols.findIndex((c) => /^(name|company|security|holding name)$/.test(c) || c.includes("name"));

  const out: Draft[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    const tickerRaw = tickerIdx >= 0 ? parts[tickerIdx] : parts[0];
    const nameRaw = nameIdx >= 0 ? parts[nameIdx] : parts[1] ?? tickerRaw;
    if (!tickerRaw) continue;
    const ticker = normalizeTicker(tickerRaw.split(/\s+/)[0]);
    if (!ticker || ticker.length > 8) continue;
    out.push({
      ticker,
      name: nameRaw || ticker,
      source,
      marketCap: null,
      exchange: "NYSE",
      homepageUrl: null,
      etfJunior: flags.etfJunior ?? false,
      etfGold: flags.etfGold ?? false,
      etfSilver: flags.etfSilver ?? false,
    });
  }
  console.info(`[universe] Parsed ${out.length} from ${path.basename(filePath)}`);
  return out;
}

function domainFromHomepage(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function clearbitLogo(domain: string | null): string | null {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

function categoryFromMarketCap(
  cap: number | null,
  draft: Draft,
  isRoyalty: boolean,
): StockCategory {
  if (isRoyalty) return "royalty";
  if (ETF_SYMBOLS.has(draft.ticker)) return "etf";
  if (draft.etfJunior) return "junior_producer";
  if (cap == null || cap <= 0) return "developer";
  if (cap >= 10_000_000_000) return "major_producer";
  if (cap >= 1_000_000_000) return "mid_tier_producer";
  if (cap >= 100_000_000) return "junior_producer";
  return "developer";
}

function subCategoryFor(draft: Draft, isRoyalty: boolean, sicSilver: boolean): StockSubCategory {
  if (isRoyalty) return "diversified";
  if (draft.etfSilver || sicSilver) return "silver";
  if (draft.etfGold || draft.source === "polygon_sic_1040" || draft.source === "etf_gdx" || draft.source === "etf_gdxj") {
    return "gold";
  }
  if (draft.source === "polygon_sic_1044" || draft.source === "etf_sil" || draft.source === "etf_silj") {
    return "silver";
  }
  return "gold";
}

function exchangeLabel(raw: string | null): string {
  if (!raw) return "NYSE";
  const u = raw.toUpperCase();
  if (u.includes("NAS") || u === "XNAS") return "NASDAQ";
  if (u.includes("ARC") || u === "NYSEARCA") return "NYSEARCA";
  return "NYSE";
}

async function main(): Promise<void> {
  loadEnvLocal();

  const drafts = new Map<string, Draft>();
  const sourcePriority: Record<SourceTag, number> = {
    royalty: 0,
    etf_gdx: 1,
    etf_gdxj: 1,
    etf_sil: 1,
    etf_silj: 1,
    polygon_sic_1040: 2,
    polygon_sic_1044: 2,
  };

  function merge(d: Draft): void {
    const existing = drafts.get(d.ticker);
    if (!existing) {
      drafts.set(d.ticker, d);
      return;
    }
    if (sourcePriority[d.source] < sourcePriority[existing.source]) {
      drafts.set(d.ticker, {
        ...d,
        etfJunior: existing.etfJunior || d.etfJunior,
        etfGold: existing.etfGold || d.etfGold,
        etfSilver: existing.etfSilver || d.etfSilver,
      });
    } else {
      existing.etfJunior = existing.etfJunior || d.etfJunior;
      existing.etfGold = existing.etfGold || d.etfGold;
      existing.etfSilver = existing.etfSilver || d.etfSilver;
      if (!existing.name && d.name) existing.name = d.name;
    }
  }

  for (const t of ROYALTY_TICKERS) {
    merge({
      ticker: t,
      name: ROYALTY_NAMES[t] ?? t,
      source: "royalty",
      marketCap: null,
      exchange: "NYSE",
      homepageUrl: null,
      etfJunior: false,
      etfGold: false,
      etfSilver: false,
    });
  }

  for (const row of parseCsvHoldings(path.join(RAW_DIR, "gdx-holdings.csv"), "etf_gdx", { etfGold: true })) {
    merge(row);
  }
  for (const row of parseCsvHoldings(path.join(RAW_DIR, "gdxj-holdings.csv"), "etf_gdxj", { etfGold: true, etfJunior: true })) {
    merge(row);
  }
  for (const row of parseCsvHoldings(path.join(RAW_DIR, "sil-holdings.csv"), "etf_sil", { etfSilver: true })) {
    merge(row);
  }
  for (const row of parseCsvHoldings(path.join(RAW_DIR, "silj-holdings.csv"), "etf_silj", { etfSilver: true, etfJunior: true })) {
    merge(row);
  }

  if (process.env.POLYGON_API_KEY?.trim()) {
    for (const sic of ["1040", "1044"] as const) {
      const tag: SourceTag = sic === "1040" ? "polygon_sic_1040" : "polygon_sic_1044";
      const res = await searchReferenceTickersBySic(sic, { marketCapMin: 50_000_000, limit: 400 });
      if (!res.ok) {
        console.warn(`[universe] Polygon SIC ${sic} failed:`, res.error);
        continue;
      }
      for (const row of res.data) {
        merge({
          ticker: row.ticker,
          name: row.name,
          source: tag,
          marketCap: row.marketCap,
          exchange: exchangeLabel(row.exchange),
          homepageUrl: row.homepageUrl,
          etfJunior: false,
          etfGold: sic === "1040",
          etfSilver: sic === "1044",
        });
      }
      console.info(`[universe] Polygon SIC ${sic}: ${res.data.length} tickers`);
    }
  } else {
    console.warn("[universe] POLYGON_API_KEY not set — skipping SIC search");
  }

  const list = [...drafts.values()];
  console.info(`[universe] Unique tickers before market cap fetch: ${list.length}`);

  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    if (d.marketCap != null && d.marketCap > 0) continue;
    if (!process.env.POLYGON_API_KEY?.trim()) continue;
    const details = await getTickerDetails(d.ticker);
    if (details.ok) {
      d.marketCap = details.data.marketCap;
      d.name = details.data.name || d.name;
      const raw = details.data.raw as { homepage_url?: string; primary_exchange?: string };
      if (typeof raw.homepage_url === "string") d.homepageUrl = raw.homepage_url;
      if (typeof raw.primary_exchange === "string") d.exchange = exchangeLabel(raw.primary_exchange);
    }
    if ((i + 1) % 25 === 0) console.info(`[universe] Market cap progress ${i + 1}/${list.length}`);
  }

  const missingLogos: string[] = [];
  const sourceCounts: Record<string, number> = {};
  const stocks: TrackedStock[] = [];

  for (const d of list) {
    sourceCounts[d.source] = (sourceCounts[d.source] ?? 0) + 1;
    const isRoyalty = ROYALTY_TICKERS.includes(d.ticker as (typeof ROYALTY_TICKERS)[number]);
    const sicSilver = d.source === "polygon_sic_1044" || d.etfSilver;
    const category = categoryFromMarketCap(d.marketCap, d, isRoyalty);
    const sub_category = subCategoryFor(d, isRoyalty, sicSilver);
    const domain =
      DOMAIN_BY_TICKER[d.ticker] ?? domainFromHomepage(d.homepageUrl) ?? null;
    const logo_url = clearbitLogo(domain);
    if (!logo_url) missingLogos.push(d.ticker);

    stocks.push({
      ticker: d.ticker,
      name: d.name,
      category,
      sub_category,
      exchange: d.exchange,
      logo_url,
    });
  }

  stocks.sort((a, b) => a.ticker.localeCompare(b.ticker));

  const byCategory: Record<string, number> = {};
  const byExchange: Record<string, number> = {};
  for (const s of stocks) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
    byExchange[s.exchange] = (byExchange[s.exchange] ?? 0) + 1;
  }

  const output: TrackedStocksFile = {
    generated_at: new Date().toISOString(),
    source_counts: sourceCounts,
    stocks,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.info("\n=== Stock universe summary ===");
  console.info(`Total: ${stocks.length}`);
  console.info("By category:", byCategory);
  console.info("By exchange:", byExchange);
  console.info("By source:", sourceCounts);
  console.info(`Missing logo_url: ${missingLogos.length}`);
  if (missingLogos.length) {
    console.info(missingLogos.slice(0, 40).join(", ") + (missingLogos.length > 40 ? "…" : ""));
  }
  if (stocks.length < 200) {
    console.warn(`⚠️  Below target range (200-250). Add ETF CSVs in data/raw/ and re-run.`);
  } else if (stocks.length > 250) {
    console.warn(`⚠️  Above target range (200-250). Review duplicates or tighten SIC filters.`);
  } else {
    console.info("✅ Within target range 200-250");
  }
  console.info(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

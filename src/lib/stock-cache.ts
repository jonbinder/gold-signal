import { unstable_cache } from "next/cache";
import { formatDisplayCompanyName } from "@/lib/format-company-name";
import { getTrackedFundHolderCount } from "@/lib/funds/holder-count";
import { preferredListLogoUrl } from "@/lib/stock-branding";
import { getTickerDetails, normalizeTicker } from "@/lib/polygon";
import { resolveStockPeRatios } from "@/lib/stock-pe-ratios";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

export type CachedDisplayStock = {
  ticker: string;
  name: string;
  category: string;
  subCategory: string;
  exchange: string | null;
  marketCap: number | null;
  peRatio: number | null;
  forwardPeRatio: number | null;
  insiderNet90dUsd: number | null;
  famousHolderCount: number | null;
  logoUrl: string;
  dataStatus: string;
};

const STOCKS_LIST_COLUMNS =
  "ticker, name, category, sub_category, exchange, logo_url, market_cap, pe_ratio, forward_pe_ratio, famous_holder_count, insider_net_90d_usd, data_status";

type StockListRow = {
  ticker: string;
  name: string;
  category: string;
  sub_category: string;
  exchange: string | null;
  logo_url: string | null;
  market_cap: number | null;
  pe_ratio: number | null;
  forward_pe_ratio: number | null;
  famous_holder_count: number | null;
  insider_net_90d_usd: number | null;
  data_status: string | null;
};

function positiveNum(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

/** True when Supabase returned usable quote fields for the list. */
function cacheHasListMetrics(stocks: CachedDisplayStock[]): boolean {
  const withCap = stocks.filter((s) => s.marketCap != null && s.marketCap > 0).length;
  return withCap >= Math.min(3, stocks.length);
}

function fallbackFromTrackedFile(): CachedDisplayStock[] {
  const deduped = new Map<string, ReturnType<typeof loadTrackedStocksSync>[number]>();
  for (const stock of loadTrackedStocksSync()) {
    const ticker = normalizeTicker(stock.ticker);
    if (!ticker || deduped.has(ticker)) continue;
    deduped.set(ticker, stock);
  }
  return [...deduped.entries()].map(([ticker, s]) => ({
    ticker,
    name: formatDisplayCompanyName(s.name),
    category: s.category,
    subCategory: s.sub_category,
    exchange: s.exchange,
    marketCap: null,
    peRatio: null,
    forwardPeRatio: null,
    insiderNet90dUsd: null,
    famousHolderCount: null,
    logoUrl: preferredListLogoUrl(ticker),
    dataStatus: "pending",
  }));
}

function rowToDisplay(stock: CachedDisplayStock, row: StockListRow): CachedDisplayStock {
  return {
    ticker: stock.ticker,
    name: formatDisplayCompanyName(row.name || stock.name),
    category: row.category || stock.category,
    subCategory: row.sub_category || stock.subCategory,
    exchange: row.exchange ?? stock.exchange,
    marketCap: positiveNum(row.market_cap) ?? stock.marketCap,
    peRatio: positiveNum(row.pe_ratio) ?? stock.peRatio,
    forwardPeRatio: positiveNum(row.forward_pe_ratio) ?? stock.forwardPeRatio,
    insiderNet90dUsd:
      typeof row.insider_net_90d_usd === "number" && Number.isFinite(row.insider_net_90d_usd)
        ? row.insider_net_90d_usd
        : stock.insiderNet90dUsd,
    famousHolderCount:
      typeof row.famous_holder_count === "number" && row.famous_holder_count >= 0
        ? row.famous_holder_count
        : stock.famousHolderCount,
    logoUrl: preferredListLogoUrl(stock.ticker, row.logo_url),
    dataStatus: row.data_status ?? stock.dataStatus,
  };
}

function mergeSeedWithDbRows(seed: CachedDisplayStock[], data: StockListRow[] | null): CachedDisplayStock[] {
  const rowByTicker = new Map<string, StockListRow>();
  for (const raw of data ?? []) {
    const sym = normalizeTicker(raw.ticker);
    if (sym) rowByTicker.set(sym, raw);
  }
  return seed.map((stock) => {
    const row = rowByTicker.get(stock.ticker);
    return row ? rowToDisplay(stock, row) : stock;
  });
}

async function loadStocksListFromSupabase(): Promise<CachedDisplayStock[]> {
  const seed = fallbackFromTrackedFile();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return seed;

  const { data, error } = await supabase.from("stock_data_cache").select(STOCKS_LIST_COLUMNS);
  if (error) {
    console.warn("[stock-cache] Supabase read failed:", error.message);
    return seed;
  }
  return mergeSeedWithDbRows(seed, data as StockListRow[]);
}

const loadStocksListFromSupabaseCached = unstable_cache(
  loadStocksListFromSupabase,
  ["stocks-list-display-db"],
  { revalidate: 3600, tags: ["stocks-list"] },
);

async function peRatiosForStock(stock: CachedDisplayStock) {
  if (stock.peRatio != null && stock.forwardPeRatio != null) {
    return { peRatio: stock.peRatio, forwardPeRatio: stock.forwardPeRatio };
  }
  const live = await resolveStockPeRatios(stock.ticker);
  return {
    peRatio: stock.peRatio ?? live.peRatio,
    forwardPeRatio: stock.forwardPeRatio ?? live.forwardPeRatio,
  };
}

/** Live Polygon/Yahoo + holder count — used when stock_data_cache is missing or empty. */
async function enrichStockLive(stock: CachedDisplayStock): Promise<CachedDisplayStock> {
  const [details, holderCount, peRatios] = await Promise.all([
    getTickerDetails(stock.ticker),
    getTrackedFundHolderCount(stock.ticker),
    peRatiosForStock(stock),
  ]);

  return {
    ...stock,
    name: formatDisplayCompanyName(details.ok ? details.data.name : stock.name),
    marketCap:
      stock.marketCap ??
      (details.ok && details.data.marketCap && details.data.marketCap > 0 ? details.data.marketCap : null),
    peRatio: peRatios.peRatio,
    forwardPeRatio: peRatios.forwardPeRatio,
    famousHolderCount: holderCount,
    logoUrl: preferredListLogoUrl(stock.ticker, stock.logoUrl),
    dataStatus: details.ok ? "healthy" : stock.dataStatus,
  };
}

const enrichLiveCached = unstable_cache(
  async () => {
    const seed = fallbackFromTrackedFile();
    console.warn(
      "[stock-cache] stock_data_cache missing or empty — enriching list from Polygon (run migration 008 + npm run sync:stock-cache)",
    );
    return Promise.all(seed.map((s) => enrichStockLive(s)));
  },
  ["stocks-list-live-fallback"],
  { revalidate: 3600, tags: ["stocks-list"] },
);

export async function getCachedDisplayStocks(): Promise<CachedDisplayStock[]> {
  const fromDb = await loadStocksListFromSupabaseCached();
  const stocks = cacheHasListMetrics(fromDb) ? fromDb : await enrichLiveCached();
  return [...stocks].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { InsiderEmptyReason, InsiderTransactionRow } from "@/lib/form4-insider";
import { normalizeInsiderTicker } from "@/lib/form4-insider";
import { formatStockSectorLabel } from "@/lib/stock-category-labels";
import { normalizeClientLogoUrl, stockLogoServePath } from "@/lib/stock-branding";
import { parseCachedPriceHistory, type CachedPricePoint } from "@/lib/charts/price-series";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

export {
  formatAsOfDate,
  formatInsiderNetLabel,
  formatMarketCapDisplay,
} from "@/lib/stock-facts-format";

export type { InsiderTransactionRow, InsiderEmptyReason };

export type StockFactsModel = {
  ticker: string;
  name: string;
  exchange: string | null;
  category: string;
  subCategory: string;
  sectorLabel: string;
  marketCap: number | null;
  description: string | null;
  ceo: string | null;
  logoUrl: string | null;
  insider: InsiderTransactionRow[];
  insiderNet90dUsd: number | null;
  insiderAsOf: string | null;
  insiderEmptyReason: InsiderEmptyReason | null;
  priceHistory12m: CachedPricePoint[];
  dataStatus: string;
  lastUpdated: string | null;
};

type FactsCacheRow = {
  ticker: string;
  name: string;
  category: string;
  sub_category: string;
  exchange: string | null;
  logo_url: string | null;
  market_cap: number | null;
  company_description: string | null;
  ceo: string | null;
  insider_transactions: InsiderTransactionRow[] | null;
  insider_net_90d_usd: number | null;
  insider_as_of: string | null;
  price_history_12m: unknown;
  data_status: string | null;
  last_updated: string | null;
};

function trackedMeta(ticker: string): {
  category: string;
  subCategory: string;
  exchange: string | null;
  name: string;
  logoUrl: string | null;
} | null {
  const sym = normalizeInsiderTicker(ticker);
  const row = loadTrackedStocksSync().find((s) => s.ticker === sym);
  if (!row) return null;
  return {
    category: row.category,
    subCategory: row.sub_category,
    exchange: row.exchange,
    name: row.name,
    logoUrl: row.logo_url,
  };
}

function parseInsiderRows(raw: unknown): InsiderTransactionRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is InsiderTransactionRow =>
      r != null &&
      typeof r === "object" &&
      (r as InsiderTransactionRow).type != null &&
      typeof (r as InsiderTransactionRow).name === "string",
  );
}

async function fetchFactsRow(ticker: string): Promise<FactsCacheRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  const sym = normalizeInsiderTicker(ticker);
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("stock_data_cache")
    .select(
      "ticker, name, category, sub_category, exchange, logo_url, market_cap, company_description, ceo, insider_transactions, insider_net_90d_usd, insider_as_of, price_history_12m, data_status, last_updated",
    )
    .eq("ticker", sym)
    .maybeSingle();

  if (error || !data) return null;
  return data as FactsCacheRow;
}

function resolveFactsLogoUrl(
  sym: string,
  row: FactsCacheRow | null,
  trackedLogo: string | null,
): string | null {
  return (
    normalizeClientLogoUrl(row?.logo_url, sym) ??
    normalizeClientLogoUrl(trackedLogo, sym) ??
    stockLogoServePath(sym)
  );
}

async function buildModel(ticker: string, row: FactsCacheRow | null): Promise<StockFactsModel | null> {
  const sym = normalizeInsiderTicker(ticker);
  const tracked = trackedMeta(sym);
  if (!row && !tracked) return null;

  const insider = row ? parseInsiderRows(row.insider_transactions) : [];

  let insiderEmptyReason: InsiderEmptyReason | null = null;
  if (insider.length === 0) {
    insiderEmptyReason = row?.last_updated ? "no_recent_filings" : "not_cached";
  }

  const category = row?.category ?? tracked?.category ?? "unknown";
  const subCategory = row?.sub_category ?? tracked?.subCategory ?? "diversified";

  return {
    ticker: sym,
    name: row?.name ?? tracked?.name ?? sym,
    exchange: row?.exchange ?? tracked?.exchange ?? null,
    category,
    subCategory,
    sectorLabel: formatStockSectorLabel(category, subCategory),
    marketCap: row?.market_cap ?? null,
    description: row?.company_description ?? null,
    ceo: row?.ceo ?? null,
    logoUrl: resolveFactsLogoUrl(sym, row, tracked?.logoUrl ?? null),
    insider,
    insiderNet90dUsd: row?.insider_net_90d_usd ?? null,
    insiderAsOf: row?.insider_as_of ?? row?.last_updated ?? null,
    insiderEmptyReason,
    priceHistory12m: row ? parseCachedPriceHistory(row.price_history_12m) : [],
    dataStatus: row?.data_status ?? "pending",
    lastUpdated: row?.last_updated ?? null,
  };
}

export const getStockFactsModel = cache(async (ticker: string): Promise<StockFactsModel | null> => {
  const row = await fetchFactsRow(ticker);
  return buildModel(ticker, row);
});

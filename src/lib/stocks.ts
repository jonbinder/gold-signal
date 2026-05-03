import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRole } from "./supabase/service-role";

/** Default Polygon REST host (Massive still supports api.polygon.io). */
const DEFAULT_POLYGON_BASE = "https://api.polygon.io";

/** How long cached rows stay fresh (Supabase + in-process fallback). */
const CACHE_TTL_MS = 120_000;

export type StockQuoteSource = "polygon" | "yahoo" | "cache";

export type StockQuote = {
  ticker: string;
  price: number;
  currency: string;
  source: StockQuoteSource;
  /** ISO timestamp when price was obtained or cache row written */
  asOf: string;
};

type CacheRow = {
  ticker: string;
  price: number;
  currency: string;
  source: string;
  fetched_at: string;
};

const memoryCache = new Map<string, { row: CacheRow }>();

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/^US:/, "");
}

function getAnonSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function polygonBaseUrl(): string {
  const raw = process.env.POLYGON_REST_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_POLYGON_BASE;
}

/**
 * Previous day's adjusted close from Polygon (stable for display; works off-session).
 */
async function fetchPolygonPrevClose(ticker: string, apiKey: string): Promise<number | null> {
  const base = polygonBaseUrl();
  const url = new URL(`/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev`, base);
  url.searchParams.set("adjusted", "true");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  if (!json || typeof json !== "object") return null;
  const results = (json as { results?: { c?: number }[] }).results;
  const c = results?.[0]?.c;
  return typeof c === "number" && Number.isFinite(c) && c > 0 ? c : null;
}

/**
 * Yahoo chart endpoint (unofficial; no API key). Used only when Polygon fails.
 */
async function fetchYahooRegularPrice(ticker: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "GoldSignal/1.0 (https://github.com/jonbinder/gold-signal)",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  const chart = json && typeof json === "object" ? (json as { chart?: { result?: unknown[] } }).chart : null;
  const result = chart?.result?.[0] as
    | {
        meta?: { regularMarketPrice?: number; previousClose?: number };
        indicators?: { quote?: { close?: (number | null)[] }[] };
      }
    | undefined;
  if (!result) return null;
  const meta = result.meta;
  if (typeof meta?.regularMarketPrice === "number" && meta.regularMarketPrice > 0) {
    return meta.regularMarketPrice;
  }
  if (typeof meta?.previousClose === "number" && meta.previousClose > 0) {
    return meta.previousClose;
  }
  const closes = result.indicators?.quote?.[0]?.close;
  if (Array.isArray(closes)) {
    for (let i = closes.length - 1; i >= 0; i--) {
      const v = closes[i];
      if (typeof v === "number" && v > 0) return v;
    }
  }
  return null;
}

async function readSupabaseCache(ticker: string): Promise<CacheRow | null> {
  const supabase = getAnonSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("stock_quote_cache")
    .select("ticker, price, currency, source, fetched_at")
    .eq("ticker", ticker)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ticker: data.ticker as string,
    price: Number(data.price),
    currency: (data.currency as string) ?? "USD",
    source: data.source as string,
    fetched_at: data.fetched_at as string,
  };
}

async function writeSupabaseCache(row: Omit<CacheRow, "fetched_at"> & { fetched_at?: string }): Promise<void> {
  const admin = getSupabaseServiceRole();
  if (!admin) return;
  const fetched_at = row.fetched_at ?? new Date().toISOString();
  const { error } = await admin.from("stock_quote_cache").upsert(
    {
      ticker: row.ticker,
      price: row.price,
      currency: row.currency,
      source: row.source,
      fetched_at,
    },
    { onConflict: "ticker" },
  );
  if (error) {
    console.warn("[stocks] Supabase cache write failed:", error.message);
  }
}

function readMemoryCache(ticker: string): CacheRow | null {
  const hit = memoryCache.get(ticker);
  if (!hit) return null;
  const age = Date.now() - new Date(hit.row.fetched_at).getTime();
  if (age > CACHE_TTL_MS) {
    memoryCache.delete(ticker);
    return null;
  }
  return hit.row;
}

function writeMemoryCache(row: CacheRow): void {
  memoryCache.set(row.ticker, { row });
}

function isFresh(row: CacheRow): boolean {
  return Date.now() - new Date(row.fetched_at).getTime() < CACHE_TTL_MS;
}

function rowToQuote(row: CacheRow, source: StockQuoteSource): StockQuote {
  return {
    ticker: row.ticker,
    price: row.price,
    currency: row.currency || "USD",
    source,
    asOf: row.fetched_at,
  };
}

/**
 * Fetches a single live-style quote: Supabase cache (fresh) → Polygon → Yahoo.
 * Never throws for missing API key; returns null if all sources fail.
 */
export async function getStockQuote(ticker: string): Promise<StockQuote | null> {
  const sym = normalizeTicker(ticker);
  if (!sym) return null;

  const mem = readMemoryCache(sym);
  if (mem && isFresh(mem)) {
    return rowToQuote(mem, "cache");
  }

  const dbRow = await readSupabaseCache(sym);
  if (dbRow && isFresh(dbRow)) {
    writeMemoryCache(dbRow);
    return rowToQuote(dbRow, "cache");
  }

  const apiKey = process.env.POLYGON_API_KEY?.trim();
  let price: number | null = null;
  let source: "polygon" | "yahoo" = "polygon";

  if (apiKey) {
    price = await fetchPolygonPrevClose(sym, apiKey);
  }
  if (price == null) {
    price = await fetchYahooRegularPrice(sym);
    source = "yahoo";
  }
  if (price == null) return null;

  const asOf = new Date().toISOString();
  const fresh: CacheRow = {
    ticker: sym,
    price,
    currency: "USD",
    source,
    fetched_at: asOf,
  };

  writeMemoryCache(fresh);
  await writeSupabaseCache(fresh);

  return {
    ticker: sym,
    price,
    currency: "USD",
    source,
    asOf,
  };
}

/**
 * Batch quotes (parallel). Each ticker resolves independently.
 */
export async function getStockQuotes(tickers: string[]): Promise<Map<string, StockQuote | null>> {
  const unique = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];
  const out = new Map<string, StockQuote | null>();
  await Promise.all(
    unique.map(async (t) => {
      const q = await getStockQuote(t);
      out.set(t, q);
    }),
  );
  return out;
}

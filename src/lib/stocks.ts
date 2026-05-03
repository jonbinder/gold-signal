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

// ─── Intraday-style snapshot (price, % change, volume) — Polygon snapshot → Yahoo chart ───

export type StockMarketSnapshot = {
  ticker: string;
  price: number | null;
  /** Percent change for the session (e.g. 1.25 = +1.25%) */
  changePct: number | null;
  volume: number | null;
  currency: string;
  source: StockQuoteSource;
  asOf: string;
};

type SnapMem = { snap: StockMarketSnapshot; at: number };
const snapshotMemory = new Map<string, SnapMem>();

function readSnapMem(sym: string): StockMarketSnapshot | null {
  const hit = snapshotMemory.get(sym);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    snapshotMemory.delete(sym);
    return null;
  }
  return { ...hit.snap, source: "cache" };
}

function writeSnapMem(snap: StockMarketSnapshot): void {
  snapshotMemory.set(snap.ticker.toUpperCase(), { snap: { ...snap, source: snap.source }, at: Date.now() });
}

/** Polygon snapshot `ticker` object (stocks + forex share most fields). */
function parsePolygonSnapshotTicker(t: Record<string, unknown>): {
  price: number | null;
  changePct: number | null;
  volume: number | null;
} | null {
  const day = t.day as { c?: number; v?: number } | undefined;
  const min = t.min as { c?: number } | undefined;
  const lastTrade = t.lastTrade as { p?: number } | undefined;
  const lastQuote = t.lastQuote as { a?: number; b?: number } | undefined;

  let price: number | null = null;
  if (typeof lastTrade?.p === "number" && lastTrade.p > 0) {
    price = lastTrade.p;
  } else if (
    typeof lastQuote?.a === "number" &&
    typeof lastQuote?.b === "number" &&
    lastQuote.a > 0 &&
    lastQuote.b > 0
  ) {
    price = (lastQuote.a + lastQuote.b) / 2;
  } else if (typeof day?.c === "number" && day.c > 0) {
    price = day.c;
  } else if (typeof min?.c === "number" && min.c > 0) {
    price = min.c;
  }

  const volume = typeof day?.v === "number" && day.v >= 0 ? day.v : null;
  const rawChange = t.todaysChangePerc;
  const changePct =
    typeof rawChange === "number" && Number.isFinite(rawChange) ? rawChange : null;
  if (price == null) return null;
  return { price, changePct, volume };
}

async function fetchPolygonSnapshot(
  symbol: string,
  apiKey: string,
): Promise<{ price: number | null; changePct: number | null; volume: number | null } | null> {
  const url = new URL(`/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}`, polygonBaseUrl());
  url.searchParams.set("apiKey", apiKey);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  const t = json && typeof json === "object" ? (json as { ticker?: Record<string, unknown> }).ticker : null;
  if (!t || typeof t !== "object") return null;
  return parsePolygonSnapshotTicker(t);
}

/** Forex pairs use `C:BASEQUOTE` (e.g. `C:XAUUSD`, `C:XAGUSD`). */
async function fetchPolygonForexSnapshot(
  symbol: string,
  apiKey: string,
): Promise<{ price: number | null; changePct: number | null; volume: number | null } | null> {
  const url = new URL(
    `/v2/snapshot/locale/global/markets/forex/tickers/${encodeURIComponent(symbol)}`,
    polygonBaseUrl(),
  );
  url.searchParams.set("apiKey", apiKey);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  const t = json && typeof json === "object" ? (json as { ticker?: Record<string, unknown> }).ticker : null;
  if (!t || typeof t !== "object") return null;
  return parsePolygonSnapshotTicker(t);
}

/** Yahoo chart symbols for Polygon forex tickers (`C:EURUSD` → `EURUSD=X`). */
function yahooSymbolForPolygonForex(sym: string): string | null {
  if (!sym.startsWith("C:") || sym.length < 4) return null;
  return `${sym.slice(2)}=X`;
}

async function fetchYahooMarketSnapshot(
  symbol: string,
): Promise<{ price: number | null; changePct: number | null; volume: number | null } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
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
        meta?: {
          regularMarketPrice?: number;
          previousClose?: number;
          regularMarketChangePercent?: number;
          regularMarketVolume?: number;
        };
      }
    | undefined;
  const meta = result?.meta;
  if (!meta) return null;
  const price =
    typeof meta.regularMarketPrice === "number" && meta.regularMarketPrice > 0
      ? meta.regularMarketPrice
      : typeof meta.previousClose === "number" && meta.previousClose > 0
        ? meta.previousClose
        : null;
  let changePct =
    typeof meta.regularMarketChangePercent === "number" && Number.isFinite(meta.regularMarketChangePercent)
      ? meta.regularMarketChangePercent
      : null;
  if (changePct != null && Math.abs(changePct) < 1.0000001 && Math.abs(changePct) > 1e-12) {
    changePct = changePct * 100;
  }
  const volume =
    typeof meta.regularMarketVolume === "number" && meta.regularMarketVolume >= 0 ? meta.regularMarketVolume : null;
  if (price == null) return null;
  return { price, changePct, volume };
}

/**
 * Price + session % change + volume. Polygon snapshot first, Yahoo chart fallback.
 * Cached in-memory for CACHE_TTL_MS (same process).
 */
export async function getStockMarketSnapshot(ticker: string): Promise<StockMarketSnapshot | null> {
  const sym = normalizeTicker(ticker);
  if (!sym) return null;

  const cached = readSnapMem(sym);
  if (cached) return cached;

  const apiKey = process.env.POLYGON_API_KEY?.trim();
  let source: "polygon" | "yahoo" = "polygon";
  let pack: { price: number | null; changePct: number | null; volume: number | null } | null = null;

  if (apiKey) {
    pack = sym.startsWith("C:")
      ? await fetchPolygonForexSnapshot(sym, apiKey)
      : await fetchPolygonSnapshot(sym, apiKey);
  }
  if (!pack || pack.price == null) {
    const yahooSym = yahooSymbolForPolygonForex(sym) ?? sym;
    pack = await fetchYahooMarketSnapshot(yahooSym);
    source = "yahoo";
  }
  if (!pack || pack.price == null) return null;

  const asOf = new Date().toISOString();
  const snap: StockMarketSnapshot = {
    ticker: sym,
    price: pack.price,
    changePct: pack.changePct,
    volume: pack.volume,
    currency: "USD",
    source,
    asOf,
  };
  writeSnapMem(snap);
  return snap;
}

/** Batch market snapshots with bounded concurrency (server-side). */
export async function getStockMarketSnapshots(
  tickers: string[],
  concurrency = 12,
): Promise<Map<string, StockMarketSnapshot | null>> {
  const unique = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];
  const out = new Map<string, StockMarketSnapshot | null>();
  for (let i = 0; i < unique.length; i += concurrency) {
    const slice = unique.slice(i, i + concurrency);
    await Promise.all(
      slice.map(async (sym) => {
        const s = await getStockMarketSnapshot(sym);
        out.set(sym, s);
      }),
    );
  }
  return out;
}

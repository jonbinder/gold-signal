import { type ApiResult, fail, ok } from "@/lib/api-result";
import { RequestThrottle, sleep } from "@/lib/http-throttle";

const DEFAULT_BASE = "https://api.polygon.io";
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

const polygonThrottle = new RequestThrottle(120);

type CacheEntry = { value: unknown; expiresAt: number };
const memoryCache = new Map<string, CacheEntry>();

export type StockPrice = {
  ticker: string;
  close: number;
  date: string;
  currency: string;
};

export type TickerDetails = {
  ticker: string;
  name: string;
  marketCap: number | null;
  sharesOutstanding: number | null;
  cik: string | null;
  raw: Record<string, unknown>;
};

export type QuarterlyFinancials = {
  fiscalPeriod: string | null;
  fiscalYear: number | null;
  endDate: string | null;
  revenue: number | null;
  freeCashFlow: number | null;
  netIncome: number | null;
  totalDebt: number | null;
  equity: number | null;
};

export type FinancialsBundle = {
  ticker: string;
  quarters: QuarterlyFinancials[];
  raw: unknown;
};

export type DailyBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type InsiderTransaction = {
  filingDate: string | null;
  transactionDate: string | null;
  ownerName: string | null;
  transactionCode: string | null;
  acquiredDisposed: string | null;
  shares: number | null;
  pricePerShare: number | null;
  value: number | null;
  officerTitle: string | null;
};

export type InstitutionalOwnership = {
  /** Percent of shares held by institutions when Polygon provides it. */
  ownershipPercent: number | null;
  holdersCount: number | null;
  asOf: string | null;
  raw: unknown;
};

function polygonBaseUrl(): string {
  const raw = process.env.POLYGON_REST_BASE_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : DEFAULT_BASE;
}

function getApiKey(): string | null {
  const key = process.env.POLYGON_API_KEY?.trim();
  return key || null;
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/^US:/, "");
}

function cacheGet<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function cacheSet(key: string, value: unknown, ttlMs = CACHE_TTL_MS): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function readNestedValue(obj: unknown, keys: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const node = record[key];
    if (node == null) continue;
    if (typeof node === "number" && Number.isFinite(node)) return node;
    if (typeof node === "object" && node !== null && "value" in node) {
      const v = (node as { value?: unknown }).value;
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
  }
  return null;
}

function parseQuarter(row: Record<string, unknown>): QuarterlyFinancials {
  const financials = (row.financials ?? {}) as Record<string, unknown>;
  const income = (financials.income_statement ?? {}) as Record<string, unknown>;
  const cashFlow = (financials.cash_flow_statement ?? {}) as Record<string, unknown>;
  const balance = (financials.balance_sheet ?? {}) as Record<string, unknown>;

  const fcf =
    readNestedValue(cashFlow, [
      "free_cash_flow",
      "net_cash_flow",
      "net_cash_flow_from_operating_activities",
    ]) ??
    (() => {
      const ocf = readNestedValue(cashFlow, ["net_cash_flow_from_operating_activities"]);
      const capex = readNestedValue(cashFlow, [
        "payments_to_acquire_property_plant_and_equipment",
        "capital_expenditure",
      ]);
      if (ocf == null) return null;
      return capex == null ? ocf : ocf - Math.abs(capex);
    })();

  return {
    fiscalPeriod: typeof row.fiscal_period === "string" ? row.fiscal_period : null,
    fiscalYear: typeof row.fiscal_year === "number" ? row.fiscal_year : null,
    endDate: typeof row.end_date === "string" ? row.end_date : null,
    revenue: readNestedValue(income, ["revenues", "revenue", "total_revenue"]),
    freeCashFlow: fcf,
    netIncome: readNestedValue(income, ["net_income_loss", "net_income", "net_income_loss_attributable_to_parent"]),
    totalDebt: readNestedValue(balance, [
      "long_term_debt",
      "long_term_debt_noncurrent",
      "debt",
      "liabilities",
    ]),
    equity: readNestedValue(balance, [
      "equity",
      "stockholders_equity",
      "equity_attributable_to_parent",
    ]),
  };
}

/**
 * Low-level Polygon GET with throttling, retries, and structured errors.
 */
async function polygonFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  opts?: { cacheKey?: string; cacheTtlMs?: number },
): Promise<ApiResult<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return fail("POLYGON_API_KEY is not configured.", { source: "polygon" });
  }

  if (opts?.cacheKey) {
    const cached = cacheGet<T>(opts.cacheKey);
    if (cached) return ok(cached);
  }

  const url = new URL(path, polygonBaseUrl());
  url.searchParams.set("apiKey", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let lastError = "Unknown Polygon error";
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await polygonThrottle.wait();

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      lastStatus = undefined;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      return fail(lastError, { retryable: true, source: "polygon" });
    }

    lastStatus = res.status;

    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      lastError = `Polygon HTTP ${res.status}${body ? `: ${body}` : ""}`;
      if (isRetryableStatus(res.status) && attempt < MAX_RETRIES - 1) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : RETRY_BASE_MS * 2 ** attempt;
        await sleep(delayMs);
        continue;
      }
      return fail(lastError, {
        statusCode: res.status,
        retryable: isRetryableStatus(res.status),
        source: "polygon",
      });
    }

    const text = await res.text();
    if (!text.trim()) {
      return fail("Polygon returned an empty response.", { statusCode: res.status, source: "polygon" });
    }

    try {
      const json = JSON.parse(text) as T;
      if (opts?.cacheKey) cacheSet(opts.cacheKey, json, opts.cacheTtlMs ?? CACHE_TTL_MS);
      return ok(json);
    } catch {
      return fail("Polygon response was not valid JSON.", { statusCode: res.status, source: "polygon" });
    }
  }

  return fail(lastError, { statusCode: lastStatus, retryable: true, source: "polygon" });
}

/**
 * Fetches the previous session's adjusted close for a US equity ticker.
 */
export async function getStockPrice(ticker: string): Promise<ApiResult<StockPrice>> {
  const sym = normalizeTicker(ticker);
  type PrevResponse = { results?: { c?: number; t?: number }[] };
  const res = await polygonFetch<PrevResponse>(
    `/v2/aggs/ticker/${encodeURIComponent(sym)}/prev`,
    { adjusted: "true" },
  );
  if (!res.ok) return res;

  const bar = res.data.results?.[0];
  const close = bar?.c;
  if (typeof close !== "number" || !Number.isFinite(close) || close <= 0) {
    return fail(`No previous close available for ${sym}.`, { source: "polygon" });
  }

  const date =
    typeof bar?.t === "number"
      ? new Date(bar.t).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  return ok({ ticker: sym, close, date, currency: "USD" });
}

/**
 * Fetches reference ticker metadata (name, market cap, shares outstanding, CIK).
 */
export async function getTickerDetails(ticker: string): Promise<ApiResult<TickerDetails>> {
  const sym = normalizeTicker(ticker);
  const cacheKey = `polygon:ticker:${sym}`;
  type RefResponse = { results?: Record<string, unknown> };
  const res = await polygonFetch<RefResponse>(
    `/v3/reference/tickers/${encodeURIComponent(sym)}`,
    {},
    { cacheKey },
  );
  if (!res.ok) return res;

  const r = res.data.results;
  if (!r || typeof r !== "object") {
    return fail(`Ticker details not found for ${sym}.`, { source: "polygon" });
  }

  const shares =
    typeof r.share_class_shares_outstanding === "number"
      ? r.share_class_shares_outstanding
      : typeof r.weighted_shares_outstanding === "number"
        ? r.weighted_shares_outstanding
        : null;

  return ok({
    ticker: sym,
    name: typeof r.name === "string" ? r.name : sym,
    marketCap: typeof r.market_cap === "number" ? r.market_cap : null,
    sharesOutstanding: shares,
    cik: typeof r.cik === "string" ? r.cik : null,
    raw: r,
  });
}

/**
 * Fetches the latest quarterly financial statements (up to four periods).
 */
export async function getFinancials(ticker: string): Promise<ApiResult<FinancialsBundle>> {
  const sym = normalizeTicker(ticker);
  const cacheKey = `polygon:financials:${sym}`;
  type FinResponse = { results?: Record<string, unknown>[] };
  const res = await polygonFetch<FinResponse>(
    "/vX/reference/financials",
    { ticker: sym, limit: 4, sort: "period_of_report_date.desc" },
    { cacheKey },
  );
  if (!res.ok) return res;

  const rows = res.data.results ?? [];
  const quarters = rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map(parseQuarter);

  return ok({ ticker: sym, quarters, raw: res.data });
}

/**
 * Fetches daily OHLCV bars for the last N calendar days.
 */
export async function getPriceHistory(ticker: string, days: number): Promise<ApiResult<DailyBar[]>> {
  const sym = normalizeTicker(ticker);
  const safeDays = Math.max(1, Math.min(days, 730));
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - safeDays);
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);

  type AggResponse = {
    results?: { t?: number; o?: number; h?: number; l?: number; c?: number; v?: number }[];
  };

  const res = await polygonFetch<AggResponse>(
    `/v2/aggs/ticker/${encodeURIComponent(sym)}/range/1/day/${from}/${to}`,
    { adjusted: "true", sort: "asc", limit: 50000 },
  );
  if (!res.ok) return res;

  const bars: DailyBar[] = (res.data.results ?? [])
    .filter((b) => typeof b?.t === "number" && typeof b?.c === "number")
    .map((b) => ({
      date: new Date(b.t!).toISOString().slice(0, 10),
      open: b.o ?? b.c!,
      high: b.h ?? b.c!,
      low: b.l ?? b.c!,
      close: b.c!,
      volume: b.v ?? 0,
    }));

  return ok(bars);
}

/**
 * Fetches daily bars for GLD as a gold price proxy (for beta / correlation).
 */
export async function getGoldPriceHistory(days: number): Promise<ApiResult<DailyBar[]>> {
  return getPriceHistory("GLD", days);
}

/**
 * Fetches daily bars for SLV as a silver price proxy (for beta / torque).
 */
export async function getSilverPriceHistory(days: number): Promise<ApiResult<DailyBar[]>> {
  return getPriceHistory("SLV", days);
}

/**
 * Attempts to load institutional ownership from Polygon. Returns null data when unavailable on the plan.
 */
export async function getInstitutionalOwnership(
  ticker: string,
): Promise<ApiResult<InstitutionalOwnership | null>> {
  const sym = normalizeTicker(ticker);

  type OwnershipResponse = {
    results?: {
      ownership_percent?: number;
      holders?: number;
      effective_date?: string;
    }[];
  };

  const endpoints = [
    `/vX/reference/institutional-ownership/${encodeURIComponent(sym)}`,
    `/stocks/v1/institutional-ownership?ticker=${encodeURIComponent(sym)}`,
  ];

  for (const path of endpoints) {
    const res = await polygonFetch<OwnershipResponse>(path, { limit: 1 });
    if (!res.ok) {
      if (res.statusCode === 404 || res.statusCode === 403 || res.statusCode === 402) continue;
      return res;
    }
    const row = res.data.results?.[0];
    if (!row) continue;
    return ok({
      ownershipPercent:
        typeof row.ownership_percent === "number" ? row.ownership_percent : null,
      holdersCount: typeof row.holders === "number" ? row.holders : null,
      asOf: typeof row.effective_date === "string" ? row.effective_date : null,
      raw: res.data,
    });
  }

  return ok(null);
}

type Form4Row = {
  filing_date?: string;
  transaction_date?: string;
  owner_name?: string | null;
  transaction_code?: string | null;
  transaction_acquired_disposed?: string | null;
  transaction_shares?: number | null;
  transaction_price_per_share?: number | null;
  transaction_value?: number | null;
  officer_title?: string | null;
};

/**
 * Fetches recent insider transactions (Form 4) from Polygon when the plan includes filings access.
 */
export async function getInsiderTransactions(
  ticker: string,
): Promise<ApiResult<InsiderTransaction[] | null>> {
  const sym = normalizeTicker(ticker);
  type Form4Response = { results?: Form4Row[] };

  const bases = [...new Set([polygonBaseUrl(), DEFAULT_BASE, "https://api.massive.com"])];
  const apiKey = getApiKey();
  if (!apiKey) {
    return fail("POLYGON_API_KEY is not configured.", { source: "polygon" });
  }

  for (const base of bases) {
    const url = new URL("/stocks/filings/vX/form-4", base.endsWith("/") ? base : `${base}/`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("tickers.any_of", sym);
    url.searchParams.set("limit", "100");
    url.searchParams.set("sort", "filing_date.desc");

    await polygonThrottle.wait();
    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } catch {
      continue;
    }

    if (res.status === 402 || res.status === 403 || res.status === 404) {
      return ok(null);
    }
    if (!res.ok) continue;

    const json = (await res.json()) as Form4Response;
    const rows = json.results ?? [];
    const mapped: InsiderTransaction[] = rows.map((r) => ({
      filingDate: r.filing_date ?? null,
      transactionDate: r.transaction_date ?? null,
      ownerName: r.owner_name ?? null,
      transactionCode: r.transaction_code ?? null,
      acquiredDisposed: r.transaction_acquired_disposed ?? null,
      shares: r.transaction_shares ?? null,
      pricePerShare: r.transaction_price_per_share ?? null,
      value: r.transaction_value ?? null,
      officerTitle: r.officer_title ?? null,
    }));
    return ok(mapped);
  }

  return ok(null);
}

export type ReferenceTickerRow = {
  ticker: string;
  name: string;
  marketCap: number | null;
  exchange: string | null;
  homepageUrl: string | null;
  sicCode: string | null;
};

/**
 * Lists active US-listed tickers matching a SIC code (paginated).
 */
export async function searchReferenceTickersBySic(
  sicCode: string,
  options?: { marketCapMin?: number; limit?: number },
): Promise<ApiResult<ReferenceTickerRow[]>> {
  const marketCapMin = options?.marketCapMin ?? 50_000_000;
  const maxResults = options?.limit ?? 500;
  const allowedExchanges = new Set(["XNYS", "XNAS", "ARCX", "NYSE", "NASDAQ", "NYSEARCA"]);

  type ListResponse = {
    results?: Record<string, unknown>[];
    next_url?: string;
  };

  const rows: ReferenceTickerRow[] = [];
  let fetchPath = "/v3/reference/tickers";
  let params: Record<string, string> = {
    sic_code: sicCode,
    market_cap_gte: String(marketCapMin),
    active: "true",
    limit: "1000",
  };

  for (let page = 0; page < 20 && rows.length < maxResults; page++) {
    const res: ApiResult<ListResponse> = await polygonFetch<ListResponse>(fetchPath, params);
    if (!res.ok) return res;

    for (const r of res.data.results ?? []) {
      const ticker = typeof r.ticker === "string" ? normalizeTicker(r.ticker) : "";
      if (!ticker) continue;
      const exchange =
        typeof r.primary_exchange === "string"
          ? r.primary_exchange
          : typeof r.locale === "string"
            ? r.locale
            : null;
      const exNorm = exchange?.toUpperCase() ?? "";
      if (exchange && !allowedExchanges.has(exNorm) && !["NYSE", "NASDAQ", "NYSEARCA"].includes(exNorm)) {
        continue;
      }
      rows.push({
        ticker,
        name: typeof r.name === "string" ? r.name : ticker,
        marketCap: typeof r.market_cap === "number" ? r.market_cap : null,
        exchange: exchange ?? "NYSE",
        homepageUrl: typeof r.homepage_url === "string" ? r.homepage_url : null,
        sicCode,
      });
      if (rows.length >= maxResults) break;
    }

    const nextUrlRaw = res.data.next_url;
    if (!nextUrlRaw || typeof nextUrlRaw !== "string") break;
    try {
      const parsed = new URL(
        nextUrlRaw.startsWith("http") ? nextUrlRaw : `${polygonBaseUrl()}${nextUrlRaw}`,
      );
      fetchPath = parsed.pathname;
      params = Object.fromEntries(parsed.searchParams.entries());
      delete params.apiKey;
    } catch {
      break;
    }
  }

  return ok(rows);
}

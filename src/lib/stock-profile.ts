import { cache } from "react";
import { getStockMarketSnapshot, type StockMarketSnapshot } from "@/lib/stocks";

const DEFAULT_POLYGON_BASE = "https://api.polygon.io";

export type PolygonTickerDetails = {
  name: string;
  description: string | null;
  homepage_url: string | null;
  market_cap: number | null;
  total_employees: number | null;
  branding?: { logo_url?: string | null; icon_url?: string | null } | null;
  address?: {
    city?: string | null;
    state?: string | null;
    address1?: string | null;
  } | null;
  cik?: string | null;
};

export type InsiderTransactionRow = {
  type: "BUY" | "SELL";
  /** Display-formatted transaction date, e.g. "May 1, 2026". */
  date: string;
  /** ISO YYYY-MM-DD used for sorting / keys. */
  dateIso: string;
  title: string;
  name: string;
  /** Share count for this line item (may be null if not reported). */
  shares: number | null;
  /** Approximate USD value (from filing or shares × price). */
  valueUsd: number | null;
};

/** Why the insider table has no rows (only meaningful when `insider` is empty). */
export type InsiderEmptyReason =
  | "no_api_key"
  | "no_recent_filings"
  | "fetch_failed"
  | "auth_failed"
  | "plan_required";

export type YahooSupplement = {
  ceo: string | null;
  nextEarningsDate: string | null;
};

function polygonBaseUrl(): string {
  const raw = process.env.POLYGON_REST_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_POLYGON_BASE;
}

let warnedNoPolygonKey = false;

/**
 * Reads `POLYGON_API_KEY` from the server environment, trimming any stray
 * whitespace/newlines that can sneak in via Vercel's env var UI. Logs a single
 * warning per process if the key is missing so the issue is visible in
 * production logs (Vercel → Functions → Logs).
 */
function getPolygonApiKey(): string | null {
  const raw = process.env.POLYGON_API_KEY;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    if (!warnedNoPolygonKey) {
      warnedNoPolygonKey = true;
      console.warn(
        "[stock-profile] POLYGON_API_KEY is not set. " +
          "Set it locally in .env.local and on Vercel under Project → Settings → Environment Variables, " +
          "then redeploy. Insider transactions and Polygon-backed data will be unavailable until configured.",
      );
    }
    return null;
  }
  return trimmed;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/^US:/, "");
}

export function formatMarketCapDisplay(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatHeadquarters(details: PolygonTickerDetails): string {
  const a = details.address;
  if (!a) return "—";
  const city = a.city?.trim();
  const state = a.state?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "—";
}

function clearbitLogoFromUrl(homepage: string | null): string | null {
  if (!homepage) return null;
  try {
    const host = new URL(homepage).hostname.replace(/^www\./, "");
    if (!host) return null;
    return `https://logo.clearbit.com/${host}`;
  } catch {
    return null;
  }
}

/** Logo URL for tables/cards (Polygon branding, then Clearbit from homepage). */
export function resolveStockLogoUrl(details: PolygonTickerDetails | null): string | null {
  if (!details) return null;
  return details.branding?.logo_url ?? clearbitLogoFromUrl(details.homepage_url);
}

async function polygonJson<T>(path: string, params: Record<string, string | undefined>): Promise<T | null> {
  const apiKey = getPolygonApiKey();
  if (!apiKey) return null;
  const url = new URL(path, polygonBaseUrl());
  url.searchParams.set("apiKey", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Reference ticker — cached per ticker / request dedupe via React cache wrapper below. */
async function fetchPolygonTickerDetailsInner(ticker: string): Promise<PolygonTickerDetails | null> {
  const sym = normalizeTicker(ticker);
  type RefResponse = { results?: Record<string, unknown>; status?: string };
  const json = await polygonJson<RefResponse>(`/v3/reference/tickers/${encodeURIComponent(sym)}`, {});
  const r = json?.results;
  if (!r || typeof r !== "object") return null;

  const branding = r.branding as PolygonTickerDetails["branding"];
  const address = r.address as PolygonTickerDetails["address"];

  return {
    name: typeof r.name === "string" ? r.name : sym,
    description: typeof r.description === "string" ? r.description : null,
    homepage_url: typeof r.homepage_url === "string" ? r.homepage_url : null,
    market_cap: typeof r.market_cap === "number" ? r.market_cap : null,
    total_employees: typeof r.total_employees === "number" ? r.total_employees : null,
    branding: branding ?? null,
    address: address ?? null,
    cik: typeof r.cik === "string" ? r.cik : null,
  };
}

export const getPolygonTickerDetails = cache(async (ticker: string): Promise<PolygonTickerDetails | null> => {
  return fetchPolygonTickerDetailsInner(ticker);
});

type AggBar = { h?: number; l?: number };
type AggResponse = { results?: AggBar[] };

async function fetch52WeekHighLow(ticker: string): Promise<{ high: number; low: number } | null> {
  const sym = normalizeTicker(ticker);
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 370);
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  const json = await polygonJson<AggResponse>(
    `/v2/aggs/ticker/${encodeURIComponent(sym)}/range/1/day/${from}/${to}`,
    { adjusted: "true", sort: "asc", limit: "50000" },
  );
  const bars = json?.results;
  if (!Array.isArray(bars) || bars.length === 0) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (const b of bars) {
    if (typeof b.h === "number" && b.h > hi) hi = b.h;
    if (typeof b.l === "number" && b.l < lo) lo = b.l;
  }
  if (!Number.isFinite(hi) || !Number.isFinite(lo) || hi <= 0 || lo <= 0) return null;
  return { high: hi, low: lo };
}

type Form4Row = {
  record_type?: string;
  security_type?: string;
  transaction_code?: string;
  transaction_acquired_disposed?: string;
  officer_title?: string | null;
  owner_name?: string | null;
  is_director?: boolean;
  is_officer?: boolean;
  is_ten_percent_owner?: boolean;
  filing_date?: string;
  transaction_date?: string;
  accession_number?: string;
  transaction_shares?: number | null;
  transaction_price_per_share?: number | null;
  transaction_value?: number | null;
};

type Form4Response = { results?: Form4Row[]; status?: string };

type Form4FetchOutcome =
  | { kind: "rows"; rows: Form4Row[] }
  | { kind: "empty_ok" }
  | { kind: "failed" }
  | { kind: "auth_failed" }
  | { kind: "plan_required" }
  | { kind: "no_api_key" };

async function fetchForm4Raw(sym: string): Promise<Form4FetchOutcome> {
  const apiKey = getPolygonApiKey();
  if (!apiKey) return { kind: "no_api_key" };

  const bases = [...new Set([polygonBaseUrl(), "https://api.polygon.io", "https://api.massive.com"])];
  const path = "/stocks/filings/vX/form-4";

  let sawAuthFailure = false;
  let sawPlanFailure = false;
  let sawOtherFailure = false;

  for (const base of bases) {
    const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("tickers.any_of", sym);
    url.searchParams.set("limit", "100");
    url.searchParams.set("sort", "filing_date.desc");

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        // Avoid serving stale "failed" responses from before the plan upgrade —
        // this endpoint is small and the page itself is `force-dynamic`.
        cache: "no-store",
      });
    } catch (err) {
      sawOtherFailure = true;
      console.warn(`[stock-profile] Form 4 fetch threw for ${sym} via ${base}:`, err);
      continue;
    }

    if (res.status === 401 || res.status === 403) {
      sawAuthFailure = true;
      const body = (await safeReadBody(res)).slice(0, 300);
      console.warn(
        `[stock-profile] Form 4 auth failure for ${sym} via ${base} ` +
          `(HTTP ${res.status}). Body: ${body || "<empty>"}`,
      );
      continue;
    }

    if (res.status === 402 || res.status === 426) {
      sawPlanFailure = true;
      const body = (await safeReadBody(res)).slice(0, 300);
      console.warn(
        `[stock-profile] Form 4 plan/upgrade required for ${sym} via ${base} ` +
          `(HTTP ${res.status}). Body: ${body || "<empty>"}`,
      );
      continue;
    }

    if (!res.ok) {
      sawOtherFailure = true;
      const body = (await safeReadBody(res)).slice(0, 200);
      console.warn(
        `[stock-profile] Form 4 fetch failed for ${sym} via ${base} ` +
          `(HTTP ${res.status}). Body: ${body || "<empty>"}`,
      );
      continue;
    }

    const text = await safeReadBody(res);
    if (!text.trim()) {
      sawOtherFailure = true;
      continue;
    }

    let json: Form4Response;
    try {
      json = JSON.parse(text) as Form4Response;
    } catch (err) {
      sawOtherFailure = true;
      console.warn(`[stock-profile] Form 4 JSON parse failed for ${sym} via ${base}:`, err);
      continue;
    }

    const list = json?.results;
    if (!Array.isArray(list)) {
      sawOtherFailure = true;
      continue;
    }
    if (list.length === 0) return { kind: "empty_ok" };
    return { kind: "rows", rows: list };
  }

  if (sawPlanFailure) return { kind: "plan_required" };
  if (sawAuthFailure) return { kind: "auth_failed" };
  if (sawOtherFailure) return { kind: "failed" };
  return { kind: "failed" };
}

async function safeReadBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function shortInsiderTitle(r: Form4Row): string {
  const raw = r.officer_title?.trim();
  if (raw) {
    const upper = raw.toUpperCase();
    // Map common longer titles to short versions for the table mockup.
    if (/CHIEF EXECUTIVE OFFICER|\bCEO\b|PRESIDENT.*CEO/.test(upper)) return "CEO";
    if (/CHIEF FINANCIAL OFFICER|\bCFO\b/.test(upper)) return "CFO";
    if (/CHIEF OPERATING OFFICER|\bCOO\b/.test(upper)) return "COO";
    if (/CHIEF LEGAL OFFICER|\bCLO\b/.test(upper)) return "CLO";
    if (/CHIEF TECHNOLOGY OFFICER|\bCTO\b/.test(upper)) return "CTO";
    if (/CHIEF MARKETING OFFICER|\bCMO\b/.test(upper)) return "CMO";
    if (/CHIEF PRODUCT OFFICER|\bCPO\b/.test(upper)) return "CPO";
    if (/GENERAL COUNSEL/.test(upper)) return "GENERAL COUNSEL";
    if (/EXECUTIVE VICE PRESIDENT|\bEVP\b/.test(upper)) return "EVP";
    if (/SENIOR VICE PRESIDENT|\bSVP\b/.test(upper)) return "SVP";
    if (/MANAGING DIRECTOR|^MD\b|\bMD,/.test(upper)) return "MD";
    if (/PRESIDENT/.test(upper)) return "PRESIDENT";
    if (/TREASURER/.test(upper)) return "TREASURER";
    if (/CONTROLLER/.test(upper)) return "CONTROLLER";
    if (/SECRETARY/.test(upper)) return "SECRETARY";
    if (/\bVP\b|VICE PRESIDENT/.test(upper)) return "VP";
    if (/DIRECTOR/.test(upper)) return "DIRECTOR";
    if (/OFFICER/.test(upper)) return "OFFICER";
    return upper.split(",")[0].trim().slice(0, 24);
  }
  if (r.is_director) return "DIRECTOR";
  if (r.is_ten_percent_owner) return "10% OWNER";
  return "INSIDER";
}

function formatInsiderName(rawName: string): string {
  // Form 4 owner names arrive as "LASTNAME FIRSTNAME M" — flip and collapse spaces.
  const cleaned = rawName.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(" ");
  if (parts.length >= 2 && parts[0] === parts[0].toUpperCase()) {
    const last = parts.shift() ?? "";
    return `${parts.join(" ")} ${last}`.toUpperCase().trim();
  }
  return cleaned.toUpperCase();
}

const DEGREE_TOKEN_RE =
  /^(?:M\.?B\.?A\.?|Ph\.?D\.?|M\.?D\.?|J\.?D\.?|LL\.?M\.?|LL\.?B\.?|B\.?A\.?|B\.?S\.?|B\.?Sc\.?|B\.?Eng\.?|B\.?Comm?\.?|M\.?A\.?|M\.?S\.?|M\.?Sc\.?|M\.?Eng\.?|MEng|MSc|BSc|BEng|MBA|MD|JD|LLM|LLB|CFA|CPA|CA|CMA|CFP|CIM|FCPA|FCA|FRM|P\.?Eng\.?|PE|P\.?Geo\.?|PGeol|R\.?P\.?Geo\.?|Esq\.?|II|III|IV|Jr\.?|Sr\.?)$/i;

function cleanCeoName(raw: string | null): string | null {
  if (!raw) return null;
  let name = raw.trim();
  if (!name) return null;
  // Drop trailing credentials after the first comma (e.g. ", EMBA").
  name = name.split(",")[0].trim();
  // Remove parenthetical credentials e.g. "(PrEng)".
  name = name.replace(/\s*\([^)]*\)\s*/g, " ");
  // Strip honorifics.
  name = name.replace(/^(Mr|Mrs|Ms|Dr|Sir|Madam|Prof)\.?\s+/i, "");
  // Collapse whitespace.
  name = name.replace(/\s+/g, " ").trim();
  // Strip trailing degree-style tokens (e.g. "BEng", "M.B.A.", "Ph.D.").
  const tokens = name.split(" ");
  while (tokens.length > 2 && DEGREE_TOKEN_RE.test(tokens[tokens.length - 1] ?? "")) {
    tokens.pop();
  }
  name = tokens.join(" ").trim();
  return name || null;
}

function formatTransactionDate(iso: string | undefined): { display: string; iso: string } | null {
  if (!iso) return null;
  // Polygon returns YYYY-MM-DD strings; treat as UTC noon to avoid TZ drift.
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return {
    display: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    iso,
  };
}

function parseTransactionFinancials(r: Form4Row): { shares: number | null; valueUsd: number | null } {
  const rawShares = r.transaction_shares;
  const shares =
    typeof rawShares === "number" && Number.isFinite(rawShares) && rawShares >= 0
      ? rawShares
      : null;

  let valueUsd: number | null = null;
  const tv = r.transaction_value;
  if (typeof tv === "number" && Number.isFinite(tv) && tv >= 0) {
    valueUsd = tv;
  } else if (shares != null) {
    const p = r.transaction_price_per_share;
    if (typeof p === "number" && Number.isFinite(p) && p >= 0) {
      valueUsd = shares * p;
    }
  }
  return { shares, valueUsd };
}

function classifyForm4Side(r: Form4Row): "BUY" | "SELL" | null {
  const code = (r.transaction_code ?? "").toUpperCase();
  const disposed = r.transaction_acquired_disposed;
  if (code === "P" || code === "M") return "BUY";
  if (code === "S" || code === "F") return "SELL";
  if (disposed === "A") return "BUY";
  if (disposed === "D") return "SELL";
  return null;
}

async function fetchForm4Transactions(ticker: string): Promise<{
  rows: InsiderTransactionRow[];
  emptyReason: InsiderEmptyReason | null;
}> {
  const sym = normalizeTicker(ticker);
  const outcome = await fetchForm4Raw(sym);

  if (outcome.kind === "no_api_key") {
    return { rows: [], emptyReason: "no_api_key" };
  }
  if (outcome.kind === "auth_failed") {
    return { rows: [], emptyReason: "auth_failed" };
  }
  if (outcome.kind === "plan_required") {
    return { rows: [], emptyReason: "plan_required" };
  }
  if (outcome.kind === "failed") {
    return { rows: [], emptyReason: "fetch_failed" };
  }
  if (outcome.kind === "empty_ok") {
    return { rows: [], emptyReason: "no_recent_filings" };
  }

  const rows = outcome.rows;
  const out: InsiderTransactionRow[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    if (r.record_type && r.record_type !== "transaction") continue;
    if (r.security_type && r.security_type !== "non_derivative") continue;

    const side = classifyForm4Side(r);
    if (!side) continue;

    const date = formatTransactionDate(r.transaction_date) ?? formatTransactionDate(r.filing_date);
    if (!date) continue;

    const title = shortInsiderTitle(r);
    const name = formatInsiderName(r.owner_name ?? "Unknown");
    const { shares, valueUsd } = parseTransactionFinancials(r);

    const acc = r.accession_number ?? "x";
    const dedupeKey = `${acc}|${r.transaction_date ?? ""}|${r.filing_date ?? ""}|${name}|${side}|${String(r.transaction_shares)}|${r.transaction_code ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({
      type: side,
      date: date.display,
      dateIso: date.iso,
      title,
      name,
      shares,
      valueUsd,
    });
  }

  if (out.length === 0) {
    return { rows: [], emptyReason: "no_recent_filings" };
  }

  out.sort((a, b) => {
    const cmp = b.dateIso.localeCompare(a.dateIso);
    if (cmp !== 0) return cmp;
    return b.name.localeCompare(a.name);
  });

  return { rows: out.slice(0, 20), emptyReason: null };
}

// ─── Yahoo crumb handshake (cookie + crumb required since 2023) ─────────────

const YAHOO_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const YAHOO_HANDSHAKE_TTL_MS = 30 * 60 * 1000;

let yahooHandshake: { cookie: string; crumb: string; at: number } | null = null;
let yahooHandshakeInflight: Promise<{ cookie: string; crumb: string } | null> | null = null;

function parseSetCookieHeaders(setCookie: string | null): string[] {
  if (!setCookie) return [];
  // Multiple Set-Cookie headers can be concatenated with comma separators in
  // node-fetch — split conservatively by ", " before "name="
  const parts: string[] = [];
  let current = "";
  for (const segment of setCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/)) {
    current = segment.trim();
    if (current) parts.push(current.split(";")[0]);
  }
  return parts;
}

async function fetchYahooHandshakeRaw(): Promise<{ cookie: string; crumb: string } | null> {
  // Step 1: visit a Yahoo property to obtain the EuConsent / A1 / B cookies.
  const cookieRes = await fetch("https://fc.yahoo.com/", {
    method: "GET",
    redirect: "manual",
    headers: { "User-Agent": YAHOO_USER_AGENT, Accept: "*/*" },
  }).catch(() => null);
  if (!cookieRes) return null;

  const setCookieHeader = cookieRes.headers.get("set-cookie");
  const cookies = parseSetCookieHeaders(setCookieHeader);
  if (cookies.length === 0) return null;
  const cookieHeader = cookies.join("; ");

  // Step 2: use cookies to ask for a crumb.
  const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    method: "GET",
    headers: {
      "User-Agent": YAHOO_USER_AGENT,
      Accept: "*/*",
      Cookie: cookieHeader,
    },
  }).catch(() => null);
  if (!crumbRes || !crumbRes.ok) return null;
  const crumb = (await crumbRes.text()).trim();
  if (!crumb) return null;

  return { cookie: cookieHeader, crumb };
}

async function getYahooHandshake(): Promise<{ cookie: string; crumb: string } | null> {
  if (yahooHandshake && Date.now() - yahooHandshake.at < YAHOO_HANDSHAKE_TTL_MS) {
    return { cookie: yahooHandshake.cookie, crumb: yahooHandshake.crumb };
  }
  if (yahooHandshakeInflight) return yahooHandshakeInflight;
  yahooHandshakeInflight = (async () => {
    const result = await fetchYahooHandshakeRaw();
    if (result) {
      yahooHandshake = { cookie: result.cookie, crumb: result.crumb, at: Date.now() };
    }
    return result;
  })();
  try {
    return await yahooHandshakeInflight;
  } finally {
    yahooHandshakeInflight = null;
  }
}

function invalidateYahooHandshake() {
  yahooHandshake = null;
}

async function yahooQuoteSummary(sym: string): Promise<unknown | null> {
  const handshake = await getYahooHandshake();
  if (!handshake) return null;
  const url = new URL(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}`);
  url.searchParams.set("modules", "assetProfile,calendarEvents");
  url.searchParams.set("crumb", handshake.crumb);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "User-Agent": YAHOO_USER_AGENT,
      Accept: "application/json",
      Cookie: handshake.cookie,
    },
    next: { revalidate: 3600 },
  });
  if (res.status === 401 || res.status === 403) {
    invalidateYahooHandshake();
    return null;
  }
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function fetchYahooSupplement(ticker: string): Promise<YahooSupplement> {
  const empty: YahooSupplement = { ceo: null, nextEarningsDate: null };
  const sym = normalizeTicker(ticker);
  try {
    const json = await yahooQuoteSummary(sym);
    if (!json) return empty;
    const result =
      json && typeof json === "object"
        ? (json as { quoteSummary?: { result?: unknown[] } }).quoteSummary?.result?.[0]
        : null;
    if (!result || typeof result !== "object") return empty;

    const assetProfile = (result as { assetProfile?: { companyOfficers?: { name?: string; title?: string }[] } }).assetProfile;
    const officers = assetProfile?.companyOfficers ?? [];
    let ceo: string | null = null;
    for (const officer of officers) {
      const title = officer.title?.toUpperCase() ?? "";
      if (title.includes("CEO") || title.includes("CHIEF EXECUTIVE")) {
        ceo = officer.name?.trim() ?? null;
        if (ceo) break;
      }
    }
    // No fallback — only display when Yahoo explicitly identifies a CEO.
    ceo = cleanCeoName(ceo);

    const cal = (result as { calendarEvents?: { earnings?: { earningsDate?: number[][] | { raw?: number }[] } } }).calendarEvents;
    const rawDate = cal?.earnings?.earningsDate?.[0];
    let earningsTimestamp: number | null = null;
    if (Array.isArray(rawDate) && typeof rawDate[0] === "number") {
      earningsTimestamp = rawDate[0];
    } else if (rawDate && typeof rawDate === "object" && typeof (rawDate as { raw?: number }).raw === "number") {
      earningsTimestamp = (rawDate as { raw: number }).raw;
    }
    let nextEarningsDate: string | null = null;
    if (earningsTimestamp && earningsTimestamp > 0) {
      nextEarningsDate = new Date(earningsTimestamp * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    return { ceo, nextEarningsDate };
  } catch {
    return empty;
  }
}

export type StockPageModel = {
  ticker: string;
  details: PolygonTickerDetails | null;
  snapshot: StockMarketSnapshot | null;
  week52: { high: number; low: number } | null;
  pctAbove52WeekLow: number | null;
  insider: InsiderTransactionRow[];
  insiderEmptyReason: InsiderEmptyReason | null;
  ceo: string | null;
  nextEarningsDate: string | null;
  logoUrl: string | null;
};

export const getStockPageModel = cache(async (ticker: string): Promise<StockPageModel> => {
  const sym = normalizeTicker(ticker);
  const [details, snapshot, week52, insiderResult, yahoo] = await Promise.all([
    getPolygonTickerDetails(sym),
    getStockMarketSnapshot(sym),
    fetch52WeekHighLow(sym),
    fetchForm4Transactions(sym),
    fetchYahooSupplement(sym),
  ]);

  const price = snapshot?.price ?? null;
  let pctAbove52WeekLow: number | null = null;
  if (price != null && week52 && week52.low > 0) {
    pctAbove52WeekLow = Math.round(((price - week52.low) / week52.low) * 100);
  }

  const logoUrl = resolveStockLogoUrl(details);

  const ceo = yahoo.ceo;
  const nextEarnings = yahoo.nextEarningsDate;

  return {
    ticker: sym,
    details,
    snapshot,
    week52,
    pctAbove52WeekLow,
    insider: insiderResult.rows,
    insiderEmptyReason: insiderResult.emptyReason,
    ceo,
    nextEarningsDate: nextEarnings,
    logoUrl,
  };
});

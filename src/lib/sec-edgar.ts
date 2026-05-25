import { type ApiResult, fail, ok } from "@/lib/api-result";
import { RequestThrottle, sleep } from "@/lib/http-throttle";
import { normalizeTicker } from "@/lib/polygon";

const SEC_DATA_BASE = "https://data.sec.gov";
const SEC_FILES_BASE = "https://www.sec.gov";
const SEC_EFTS_BASE = "https://efts.sec.gov/LATEST/search-index";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 400;

/** SEC requires a descriptive User-Agent (company + contact email). */
const DEFAULT_USER_AGENT = "GoldSignal.ai reports@goldsignal.ai";

const secThrottle = new RequestThrottle(110);

type CompanyTickerRow = { cik_str: number; ticker: string; title: string };
let companyTickerIndex: Map<string, { cik: string; title: string }> | null = null;
let companyTickerLoadedAt = 0;
const COMPANY_TICKERS_TTL_MS = 24 * 60 * 60 * 1000;

export type EdgarInsiderFiling = {
  accessionNumber: string;
  filingDate: string;
  reportDate: string | null;
  form: string;
  primaryDocument: string | null;
};

export type EdgarInstitutionalFilingHit = {
  accessionNumber: string;
  filedAt: string;
  form: string;
  companyName: string | null;
  fileNumber: string | null;
};

function secUserAgent(): string {
  return process.env.SEC_EDGAR_USER_AGENT?.trim() || DEFAULT_USER_AGENT;
}

function padCik(cik: string | number): string {
  const digits = String(cik).replace(/\D/g, "");
  return digits.padStart(10, "0");
}

async function secFetch(
  url: string,
  opts?: { accept?: string },
): Promise<ApiResult<unknown>> {
  let lastError = "SEC request failed";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await secThrottle.wait();

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: opts?.accept ?? "application/json",
          "User-Agent": secUserAgent(),
        },
        cache: "no-store",
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      return fail(lastError, { retryable: true, source: "sec-edgar" });
    }

    if (res.status === 429 && attempt < MAX_RETRIES - 1) {
      await sleep(RETRY_BASE_MS * 2 ** (attempt + 1));
      continue;
    }

    if (!res.ok) {
      const snippet = (await res.text()).slice(0, 200);
      return fail(`SEC HTTP ${res.status}${snippet ? `: ${snippet}` : ""}`, {
        statusCode: res.status,
        source: "sec-edgar",
      });
    }

    const text = await res.text();
    if (!text.trim()) return fail("SEC returned an empty body.", { source: "sec-edgar" });

    try {
      return ok(JSON.parse(text));
    } catch {
      return fail("SEC response was not valid JSON.", { source: "sec-edgar" });
    }
  }

  return fail(lastError, { source: "sec-edgar" });
}

/**
 * Loads and caches the SEC company tickers index for ticker → CIK resolution.
 */
async function loadCompanyTickerIndex(): Promise<ApiResult<Map<string, { cik: string; title: string }>>> {
  if (companyTickerIndex && Date.now() - companyTickerLoadedAt < COMPANY_TICKERS_TTL_MS) {
    return ok(companyTickerIndex);
  }

  const res = await secFetch(`${SEC_FILES_BASE}/files/company_tickers.json`);
  if (!res.ok) return res;

  const raw = res.data;
  const map = new Map<string, { cik: string; title: string }>();

  if (raw && typeof raw === "object") {
    for (const row of Object.values(raw as Record<string, CompanyTickerRow>)) {
      if (!row?.ticker || row.cik_str == null) continue;
      const ticker = row.ticker.toUpperCase();
      map.set(ticker, { cik: padCik(row.cik_str), title: row.title });
    }
  }

  companyTickerIndex = map;
  companyTickerLoadedAt = Date.now();
  return ok(map);
}

/**
 * Resolves a US ticker symbol to a zero-padded SEC CIK.
 */
export async function resolveTickerToCik(ticker: string): Promise<ApiResult<string>> {
  const sym = normalizeTicker(ticker);
  const indexRes = await loadCompanyTickerIndex();
  if (!indexRes.ok) return indexRes;

  const hit = indexRes.data.get(sym);
  if (!hit) {
    return fail(`No SEC CIK found for ticker ${sym}.`, { source: "sec-edgar" });
  }
  return ok(hit.cik);
}

type SubmissionsPayload = {
  name?: string;
  cik?: string;
  tickers?: string[];
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      reportDate?: string[];
      form?: string[];
      primaryDocument?: string[];
    };
  };
};

/**
 * Fetches the EDGAR submissions JSON for a company CIK.
 */
export async function getCompanySubmissions(cik: string): Promise<ApiResult<SubmissionsPayload>> {
  const padded = padCik(cik);
  const res = await secFetch(`${SEC_DATA_BASE}/submissions/CIK${padded}.json`);
  if (!res.ok) return res;
  return ok(res.data as SubmissionsPayload);
}

/**
 * Returns recent Form 4 filings for a company from SEC submissions metadata.
 */
export async function getInsiderTransactions(ticker: string): Promise<ApiResult<EdgarInsiderFiling[]>> {
  const cikRes = await resolveTickerToCik(ticker);
  if (!cikRes.ok) return cikRes;

  const subRes = await getCompanySubmissions(cikRes.data);
  if (!subRes.ok) return subRes;

  const recent = subRes.data.filings?.recent;
  if (!recent?.form?.length) return ok([]);

  const filings: EdgarInsiderFiling[] = [];
  const len = recent.form.length;

  for (let i = 0; i < len; i++) {
    const form = recent.form[i];
    if (form !== "4" && form !== "4/A") continue;
    const accession = recent.accessionNumber?.[i];
    const filingDate = recent.filingDate?.[i];
    if (!accession || !filingDate) continue;
    filings.push({
      accessionNumber: accession,
      filingDate,
      reportDate: recent.reportDate?.[i] ?? null,
      form,
      primaryDocument: recent.primaryDocument?.[i] ?? null,
    });
    if (filings.length >= 50) break;
  }

  return ok(filings);
}

/**
 * Searches recent 13F-HR filings that mention a ticker or company name (EFTS full-text index).
 * Useful when Polygon institutional ownership is unavailable; does not compute ownership %.
 */
export async function getInstitutionalHoldings(
  ticker: string,
): Promise<ApiResult<EdgarInstitutionalFilingHit[]>> {
  const sym = normalizeTicker(ticker);
  const indexRes = await loadCompanyTickerIndex();
  const companyName = indexRes.ok ? (indexRes.data.get(sym)?.title ?? sym) : sym;

  const start = new Date();
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  const startdt = start.toISOString().slice(0, 10);
  const enddt = new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams({
    q: `"${companyName}" OR "${sym}"`,
    forms: "13F-HR,13F-HR/A",
    startdt,
    enddt,
    page: "1",
  });

  await secThrottle.wait();
  let res: Response;
  try {
    res = await fetch(`${SEC_EFTS_BASE}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": secUserAgent(),
      },
      cache: "no-store",
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "EFTS search failed", {
      source: "sec-edgar",
      retryable: true,
    });
  }

  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    return fail(`SEC EFTS HTTP ${res.status}${body ? `: ${body}` : ""}`, {
      statusCode: res.status,
      source: "sec-edgar",
    });
  }

  const json = (await res.json()) as {
    hits?: {
      hits?: {
        _source?: {
          adsh?: string;
          file_date?: string;
          form?: string;
          display_names?: string[];
          file_num?: string;
        };
      }[];
    };
  };

  const hits = json.hits?.hits ?? [];
  const filings: EdgarInstitutionalFilingHit[] = hits
    .map((h) => h._source)
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({
      accessionNumber: s.adsh ?? "",
      filedAt: s.file_date ?? "",
      form: s.form ?? "13F-HR",
      companyName: s.display_names?.[0] ?? null,
      fileNumber: s.file_num ?? null,
    }))
    .filter((f) => f.accessionNumber && f.filedAt);

  return ok(filings);
}

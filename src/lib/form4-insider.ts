const DEFAULT_POLYGON_BASE = "https://api.polygon.io";

export type InsiderTransactionRow = {
  type: "BUY" | "SELL";
  date: string;
  dateIso: string;
  title: string;
  name: string;
  shares: number | null;
  valueUsd: number | null;
};

export type InsiderEmptyReason =
  | "no_api_key"
  | "no_recent_filings"
  | "fetch_failed"
  | "auth_failed"
  | "plan_required"
  | "not_cached";

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

function polygonBaseUrl(): string {
  const raw = process.env.POLYGON_REST_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_POLYGON_BASE;
}

export function normalizeInsiderTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/^US:/, "");
}

function getPolygonApiKey(): string | null {
  const raw = process.env.POLYGON_API_KEY;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || null;
}

async function safeReadBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

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
        cache: "no-store",
      });
    } catch {
      sawOtherFailure = true;
      continue;
    }

    if (res.status === 401 || res.status === 403) {
      sawAuthFailure = true;
      continue;
    }
    if (res.status === 402 || res.status === 426) {
      sawPlanFailure = true;
      continue;
    }
    if (!res.ok) {
      sawOtherFailure = true;
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
    } catch {
      sawOtherFailure = true;
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

function shortInsiderTitle(r: Form4Row): string {
  const raw = r.officer_title?.trim();
  if (raw) {
    const upper = raw.toUpperCase();
    if (/CHIEF EXECUTIVE OFFICER|\bCEO\b|PRESIDENT.*CEO/.test(upper)) return "CEO";
    if (/CHIEF FINANCIAL OFFICER|\bCFO\b/.test(upper)) return "CFO";
    if (/CHIEF OPERATING OFFICER|\bCOO\b/.test(upper)) return "COO";
    if (/DIRECTOR/.test(upper)) return "DIRECTOR";
    if (/OFFICER/.test(upper)) return "OFFICER";
    return upper.split(",")[0].trim().slice(0, 24);
  }
  if (r.is_director) return "DIRECTOR";
  if (r.is_ten_percent_owner) return "10% OWNER";
  return "INSIDER";
}

function formatInsiderName(rawName: string): string {
  const cleaned = rawName.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(" ");
  if (parts.length >= 2 && parts[0] === parts[0].toUpperCase()) {
    const last = parts.shift() ?? "";
    return `${parts.join(" ")} ${last}`.toUpperCase().trim();
  }
  return cleaned.toUpperCase();
}

function formatTransactionDate(iso: string | undefined): { display: string; iso: string } | null {
  if (!iso) return null;
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
    typeof rawShares === "number" && Number.isFinite(rawShares) && rawShares >= 0 ? rawShares : null;

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

export function parseForm4Rows(rows: Form4Row[], limit = 20): InsiderTransactionRow[] {
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

  out.sort((a, b) => {
    const cmp = b.dateIso.localeCompare(a.dateIso);
    if (cmp !== 0) return cmp;
    return b.name.localeCompare(a.name);
  });

  return out.slice(0, limit);
}

/** Net insider dollar flow over the last 90 days from parsed transaction rows. */
export function computeInsiderNet90dUsd(rows: InsiderTransactionRow[]): number | null {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 90);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  let net = 0;
  let count = 0;

  for (const row of rows) {
    if (row.dateIso < cutoffIso) continue;
    if (row.valueUsd == null || !Number.isFinite(row.valueUsd)) continue;
    net += row.type === "BUY" ? row.valueUsd : -row.valueUsd;
    count++;
  }

  return count > 0 ? net : null;
}

export async function fetchForm4Transactions(ticker: string): Promise<{
  rows: InsiderTransactionRow[];
  emptyReason: InsiderEmptyReason | null;
}> {
  const sym = normalizeInsiderTicker(ticker);
  const outcome = await fetchForm4Raw(sym);

  if (outcome.kind === "no_api_key") return { rows: [], emptyReason: "no_api_key" };
  if (outcome.kind === "auth_failed") return { rows: [], emptyReason: "auth_failed" };
  if (outcome.kind === "plan_required") return { rows: [], emptyReason: "plan_required" };
  if (outcome.kind === "failed") return { rows: [], emptyReason: "fetch_failed" };
  if (outcome.kind === "empty_ok") return { rows: [], emptyReason: "no_recent_filings" };

  const parsed = parseForm4Rows(outcome.rows);
  if (parsed.length === 0) return { rows: [], emptyReason: "no_recent_filings" };
  return { rows: parsed, emptyReason: null };
}

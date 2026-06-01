import { type ApiResult, fail, ok } from "@/lib/api-result";
import { RequestThrottle, sleep } from "@/lib/http-throttle";

const SEC_DATA_BASE = "https://data.sec.gov";
const SEC_ARCHIVES = "https://www.sec.gov/Archives/edgar/data";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 400;

const secThrottle = new RequestThrottle(110);

export type Parsed13FHolding = {
  nameOfIssuer: string;
  titleOfClass: string;
  cusip: string;
  valueUsd: number;
  shares: number;
};

export type Latest13FFiling = {
  accessionNumber: string;
  accessionPath: string;
  filingDate: string;
  reportDate: string | null;
  form: string;
};

function secUserAgent(): string {
  return process.env.SEC_EDGAR_USER_AGENT?.trim() || "GoldSignal.ai reports@goldsignal.ai";
}

export function padCik(cik: string | number): string {
  const digits = String(cik).replace(/\D/g, "");
  return digits.padStart(10, "0");
}

export function cikToEdgarPath(cik: string): string {
  return String(cik).replace(/\D/g, "").replace(/^0+/, "") || "0";
}

function accessionToFolder(accession: string): string {
  return accession.replace(/-/g, "");
}

async function secFetchText(url: string, accept = "application/json"): Promise<ApiResult<string>> {
  let lastError = "SEC request failed";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await secThrottle.wait();
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: accept,
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
      return fail(lastError, { retryable: true, source: "sec-edgar-13f" });
    }

    if (res.status === 429 && attempt < MAX_RETRIES - 1) {
      await sleep(RETRY_BASE_MS * 2 ** (attempt + 1));
      continue;
    }

    if (!res.ok) {
      const snippet = (await res.text()).slice(0, 200);
      return fail(`SEC HTTP ${res.status}${snippet ? `: ${snippet}` : ""}`, {
        statusCode: res.status,
        source: "sec-edgar-13f",
      });
    }

    return ok(await res.text());
  }

  return fail(lastError, { source: "sec-edgar-13f" });
}

type SubmissionsPayload = {
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      reportDate?: string[];
      form?: string[];
    };
  };
};

/**
 * Returns the most recent 13F-HR (or amendment) filing metadata for a filer CIK.
 */
export async function getLatest13FFiling(cik: string): Promise<ApiResult<Latest13FFiling | null>> {
  const padded = padCik(cik);
  const res = await secFetchText(`${SEC_DATA_BASE}/submissions/CIK${padded}.json`);
  if (!res.ok) return res;

  const data = JSON.parse(res.data) as SubmissionsPayload;
  const recent = data.filings?.recent;
  if (!recent?.form?.length) return ok(null);

  for (let i = 0; i < recent.form.length; i++) {
    const form = recent.form[i];
    if (form !== "13F-HR" && form !== "13F-HR/A") continue;
    const accession = recent.accessionNumber?.[i];
    const filingDate = recent.filingDate?.[i];
    if (!accession || !filingDate) continue;
    return ok({
      accessionNumber: accession,
      accessionPath: accessionToFolder(accession),
      filingDate,
      reportDate: recent.reportDate?.[i] ?? null,
      form,
    });
  }

  return ok(null);
}

type FilingIndexEntry = { name?: string };

/**
 * Parses 13F information table XML (infoTable rows).
 * Value in filing is reported in thousands of USD.
 */
export function parse13FInfoTableXml(xml: string): Parsed13FHolding[] {
  const holdings: Parsed13FHolding[] = [];
  const blocks = xml.split(/<infoTable\b/i);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]!.split(/<\/infoTable>/i)[0]!;
    const tag = (name: string) => {
      const m = block.match(new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, "i"));
      return m?.[1]?.trim() ?? "";
    };
    const nested = (parent: string, child: string) => {
      const parentBlock = block.match(new RegExp(`<${parent}[^>]*>([\\s\\S]*?)</${parent}>`, "i"));
      if (!parentBlock) return "";
      const m = parentBlock[1]!.match(new RegExp(`<${child}[^>]*>([^<]*)</${child}>`, "i"));
      return m?.[1]?.trim() ?? "";
    };

    const nameOfIssuer = tag("nameOfIssuer");
    const cusip = tag("cusip");
    const valueRaw = tag("value");
    const shares =
      Number(nested("shrsOrPrnAmt", "sshPrnamt")) ||
      Number(nested("shrsOrPrnAmt", "sshPrnamtAmt")) ||
      0;
    const valueThousands = Number(valueRaw.replace(/,/g, ""));
    if (!nameOfIssuer || !Number.isFinite(valueThousands)) continue;

    holdings.push({
      nameOfIssuer,
      titleOfClass: tag("titleOfClass"),
      cusip,
      valueUsd: Math.round(valueThousands * 1000),
      shares: Math.round(shares),
    });
  }
  return holdings;
}

/**
 * Downloads and parses the information table from a 13F-HR filing.
 */
export async function fetch13FHoldingsForFiling(
  cik: string,
  filing: Latest13FFiling,
): Promise<ApiResult<Parsed13FHolding[]>> {
  const cikPath = cikToEdgarPath(cik);
  const base = `${SEC_ARCHIVES}/${cikPath}/${filing.accessionPath}`;

  const indexRes = await secFetchText(`${base}/index.json`);
  if (!indexRes.ok) return indexRes;

  const index = JSON.parse(indexRes.data) as { directory?: { item?: FilingIndexEntry[] } };
  const items = index.directory?.item ?? [];
  const infoFile = items
    .map((it) => it.name ?? "")
    .find((name) => /infotable/i.test(name) && /\.xml$/i.test(name));

  if (!infoFile) {
    return fail("No information table XML found in 13F filing index.", { source: "sec-edgar-13f" });
  }

  const xmlRes = await secFetchText(`${base}/${infoFile}`, "application/xml,text/xml,*/*");
  if (!xmlRes.ok) return xmlRes;

  return ok(parse13FInfoTableXml(xmlRes.data));
}

export async function fetchLatest13FHoldings(cik: string): Promise<
  ApiResult<{
    filing: Latest13FFiling;
    holdings: Parsed13FHolding[];
  } | null>
> {
  const filingRes = await getLatest13FFiling(cik);
  if (!filingRes.ok) return filingRes;
  if (!filingRes.data) return ok(null);

  const holdingsRes = await fetch13FHoldingsForFiling(cik, filingRes.data);
  if (!holdingsRes.ok) return holdingsRes;

  return ok({ filing: filingRes.data, holdings: holdingsRes.data });
}

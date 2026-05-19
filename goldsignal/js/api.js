const POLYGON_BASE = 'https://api.polygon.io';
const RATE_LIMIT_MS = 200;

/** @typedef {Object} InsiderTransaction
 * @property {string|null} filingDate
 * @property {string|null} insiderName
 * @property {string|null} transactionType
 * @property {number|null} shares
 * @property {number|null} price
 * @property {number|null} value
 */

/** @typedef {Object} SignalData
 * @property {string} ticker
 * @property {number|null} currentPrice
 * @property {number|null} peRatio
 * @property {number|null} forwardPE
 * @property {InsiderTransaction[]} insiderTransactions
 * @property {number|null} institutionalCount
 * @property {string} fetchedAt
 * @property {Record<string, string>} sources
 * @property {Record<string, string>} [errors]
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey() {
  const key =
    (typeof process !== 'undefined' && process.env?.POLYGON_API_KEY) ||
    (typeof globalThis !== 'undefined' && globalThis.POLYGON_API_KEY);

  if (!key) {
    throw new Error('POLYGON_API_KEY environment variable is not set');
  }
  return key;
}

function normalizeTicker(ticker) {
  return String(ticker).trim().toUpperCase();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getNestedValue(obj, path) {
  return path.reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
}

/**
 * @param {string} path
 * @param {Record<string, string|number|boolean>} [params]
 */
async function polygonGet(path, params = {}) {
  const url = new URL(`${POLYGON_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetch(url.toString());

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after')) || 1;
    await sleep(retryAfter * 1000);
    return polygonGet(path, params);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Polygon API ${response.status} for ${path}: ${body.slice(0, 200) || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Extract current price from /v2/snapshot (single-ticker stock snapshot).
 * @param {unknown} data
 * @returns {number|null}
 */
function parseCurrentPrice(data) {
  const ticker = data?.ticker;
  if (!ticker) return null;

  const candidates = [
    ticker.lastTrade?.p,
    ticker.lastQuote?.P,
    ticker.lastQuote?.p,
    ticker.min?.c,
    ticker.day?.c,
    ticker.prevDay?.c,
    ticker.fmv,
  ];

  for (const value of candidates) {
    const n = toNumber(value);
    if (n != null && n > 0) return n;
  }

  return null;
}

/**
 * Extract trailing and forward P/E from /v3/reference/financials.
 * @param {unknown} data
 * @param {number|null} currentPrice
 */
function parseFinancialRatios(data, currentPrice) {
  const latest = data?.results?.[0];
  if (!latest) {
    return { peRatio: null, forwardPE: null };
  }

  let peRatio =
    toNumber(latest.price_to_earnings) ??
    toNumber(latest.pe_ratio) ??
    toNumber(latest.peRatio);

  let forwardPE =
    toNumber(latest.forward_pe) ??
    toNumber(latest.forwardPE) ??
    toNumber(latest.price_to_forward_earnings);

  const income = latest.financials?.income_statement ?? latest.income_statement;
  const eps =
    toNumber(getNestedValue(income, ['basic_earnings_per_share', 'value'])) ??
    toNumber(getNestedValue(income, ['diluted_earnings_per_share', 'value'])) ??
    toNumber(income?.basic_earnings_per_share) ??
    toNumber(income?.diluted_earnings_per_share);

  const forwardEps =
    toNumber(getNestedValue(income, ['forward_earnings_per_share', 'value'])) ??
    toNumber(latest.forward_eps) ??
    toNumber(latest.estimated_eps);

  if (peRatio == null && currentPrice != null && eps != null && eps > 0) {
    peRatio = currentPrice / eps;
  }

  if (forwardPE == null && currentPrice != null && forwardEps != null && forwardEps > 0) {
    forwardPE = currentPrice / forwardEps;
  }

  return { peRatio, forwardPE };
}

/**
 * Normalize insider rows from /v4/insider-transactions.
 * @param {unknown} data
 * @returns {InsiderTransaction[]}
 */
function parseInsiderTransactions(data) {
  const rows = data?.results ?? data?.transactions ?? data?.data ?? [];
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    filingDate: row.filing_date ?? row.filingDate ?? row.transaction_date ?? null,
    insiderName: row.insider_name ?? row.name ?? row.reporting_owner_name ?? null,
    transactionType:
      row.transaction_type ??
      row.transaction_code ??
      row.acquisition_disposition ??
      null,
    shares: toNumber(row.shares ?? row.transaction_shares ?? row.securities_transacted),
    price: toNumber(row.price ?? row.transaction_price ?? row.price_per_share),
    value: toNumber(row.value ?? row.transaction_value ?? row.total_value),
  }));
}

/**
 * Institutional holder count from /v3/reference/holders.
 * @param {unknown} data
 * @returns {number|null}
 */
function parseInstitutionalCount(data) {
  const rows = data?.results ?? data?.holders ?? [];
  if (!Array.isArray(rows)) {
    return toNumber(data?.count ?? data?.institutional_count);
  }

  const institutional = rows.filter((row) => {
    const type = String(row.holder_type ?? row.type ?? row.investor_type ?? '').toLowerCase();
    if (!type) return true;
    return type.includes('institution') || type.includes('investment') || type.includes('fund');
  });

  const count = institutional.length > 0 ? institutional.length : rows.length;
  return count > 0 ? count : null;
}

/**
 * Fetch Polygon.io market, financial, insider, and holder data for scoring.
 * @param {string} ticker
 * @returns {Promise<SignalData>}
 */
export async function fetchSignalData(ticker) {
  const symbol = normalizeTicker(ticker);

  /** @type {SignalData} */
  const signalData = {
    ticker: symbol,
    currentPrice: null,
    peRatio: null,
    forwardPE: null,
    insiderTransactions: [],
    institutionalCount: null,
    fetchedAt: new Date().toISOString(),
    sources: {
      currentPrice: '/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}',
      peRatio: '/v3/reference/financials',
      forwardPE: '/v3/reference/financials',
      insiderTransactions: '/v4/insider-transactions',
      institutionalCount: '/v3/reference/holders',
    },
    errors: {},
  };

  // 1. Snapshot — current price
  try {
    const snapshot = await polygonGet(
      `/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}`
    );
    signalData.currentPrice = parseCurrentPrice(snapshot);
  } catch (err) {
    signalData.errors.currentPrice = err instanceof Error ? err.message : String(err);
  }

  await sleep(RATE_LIMIT_MS);

  // 2. Financials — P/E ratios
  try {
    const financials = await polygonGet('/v3/reference/financials', {
      ticker: symbol,
      limit: 1,
      sort: 'filing_date',
      order: 'desc',
    });
    const ratios = parseFinancialRatios(financials, signalData.currentPrice);
    signalData.peRatio = ratios.peRatio;
    signalData.forwardPE = ratios.forwardPE;
  } catch (err) {
    signalData.errors.peRatio = err instanceof Error ? err.message : String(err);
    signalData.errors.forwardPE = signalData.errors.peRatio;
  }

  await sleep(RATE_LIMIT_MS);

  // 3. Insider transactions
  try {
    const insiders = await polygonGet('/v4/insider-transactions', {
      ticker: symbol,
      limit: 50,
      sort: 'filing_date',
      order: 'desc',
    });
    signalData.insiderTransactions = parseInsiderTransactions(insiders);
  } catch (err) {
    signalData.errors.insiderTransactions =
      err instanceof Error ? err.message : String(err);
  }

  await sleep(RATE_LIMIT_MS);

  // 4. Institutional holders
  try {
    const holders = await polygonGet('/v3/reference/holders', {
      ticker: symbol,
      limit: 1000,
    });
    signalData.institutionalCount = parseInstitutionalCount(holders);
  } catch (err) {
    signalData.errors.institutionalCount =
      err instanceof Error ? err.message : String(err);
  }

  if (Object.keys(signalData.errors).length === 0) {
    delete signalData.errors;
  }

  return signalData;
}

export {
  getApiKey,
  normalizeTicker,
  parseCurrentPrice,
  parseFinancialRatios,
  parseInsiderTransactions,
  parseInstitutionalCount,
};

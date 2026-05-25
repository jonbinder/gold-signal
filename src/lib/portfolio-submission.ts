const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TICKER_RE = /^[A-Z.]+$/;
export const MAX_PORTFOLIO_TICKERS = 20;
export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_TICKERS_RAW_LENGTH = 2000;

export type SubmissionInput = {
  name: string;
  email: string;
  tickers: string[];
};

export type SubmissionValidationError = {
  field: "name" | "email" | "tickers" | "body";
  message: string;
};

/**
 * Parses a raw ticker string (comma, newline, or whitespace separated) into tokens.
 */
export function parseTickerInput(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Normalizes tickers: uppercase, strip whitespace, dedupe, allow only A-Z and dots.
 */
export function sanitizeTickers(rawTickers: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of rawTickers) {
    const ticker = raw.trim().toUpperCase();
    if (!ticker || !TICKER_RE.test(ticker)) continue;
    if (seen.has(ticker)) continue;
    seen.add(ticker);
    result.push(ticker);
  }

  return result;
}

/**
 * Validates and normalizes a portfolio submission payload from the API.
 */
export function validateSubmissionPayload(
  body: unknown
): { ok: true; data: SubmissionInput } | { ok: false; error: SubmissionValidationError } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: { field: "body", message: "Invalid request body." } };
  }

  const { name, email, tickers: tickersField } = body as {
    name?: unknown;
    email?: unknown;
    tickers?: unknown;
  };

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return { ok: false, error: { field: "name", message: "Name is required." } };
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: { field: "name", message: `Name must be at most ${MAX_NAME_LENGTH} characters.` },
    };
  }

  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (!trimmedEmail) {
    return { ok: false, error: { field: "email", message: "Email is required." } };
  }
  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    return {
      ok: false,
      error: { field: "email", message: "Email address is too long." },
    };
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: { field: "email", message: "Please enter a valid email address." } };
  }

  let rawTickers: string[] = [];
  if (typeof tickersField === "string") {
    if (tickersField.length > MAX_TICKERS_RAW_LENGTH) {
      return {
        ok: false,
        error: { field: "tickers", message: "Ticker list is too long." },
      };
    }
    rawTickers = parseTickerInput(tickersField);
  } else if (Array.isArray(tickersField)) {
    rawTickers = tickersField.filter((t): t is string => typeof t === "string");
  } else {
    return { ok: false, error: { field: "tickers", message: "Tickers are required." } };
  }

  const tickers = sanitizeTickers(rawTickers);
  if (tickers.length === 0) {
    return {
      ok: false,
      error: {
        field: "tickers",
        message: "Enter at least one valid ticker (letters and dots only, e.g. NEM or BRK.A).",
      },
    };
  }
  if (tickers.length > MAX_PORTFOLIO_TICKERS) {
    return {
      ok: false,
      error: {
        field: "tickers",
        message: `You can submit at most ${MAX_PORTFOLIO_TICKERS} tickers.`,
      },
    };
  }

  return {
    ok: true,
    data: { name: trimmedName, email: trimmedEmail.toLowerCase(), tickers },
  };
}

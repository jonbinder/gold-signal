const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WatchlistSignupPayload = {
  name: string;
  email: string;
  stocksWatching: string;
};

export type WatchlistValidationResult =
  | { ok: true; data: WatchlistSignupPayload }
  | { ok: false; error: string; field?: string };

export function validateWatchlistPayload(body: unknown): WatchlistValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body.", field: "body" };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const stocksWatching =
    typeof raw.stocksWatching === "string"
      ? raw.stocksWatching.trim()
      : typeof raw.stocks_watching === "string"
        ? raw.stocks_watching.trim()
        : "";

  if (!name) return { ok: false, error: "Name is required.", field: "name" };
  if (name.length > 120) return { ok: false, error: "Name is too long.", field: "name" };
  if (!email) return { ok: false, error: "Email is required.", field: "email" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address.", field: "email" };
  if (!stocksWatching) {
    return { ok: false, error: "Tell us which stocks you're watching.", field: "stocksWatching" };
  }
  if (stocksWatching.length > 2000) {
    return { ok: false, error: "Watchlist text is too long.", field: "stocksWatching" };
  }

  return { ok: true, data: { name, email, stocksWatching } };
}

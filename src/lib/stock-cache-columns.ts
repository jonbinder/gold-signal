/** PostgREST / Postgres error when migration 021 not applied yet. */
export function isMissingPriceHistoryColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /price_history_12m/i.test(error.message ?? "");
}

/** Literal select strings for typed Supabase client (do not build via template). */
export const STOCK_FACTS_CACHE_SELECT_BASE =
  "ticker, name, category, sub_category, exchange, logo_url, market_cap, company_description, ceo, insider_transactions, insider_net_90d_usd, insider_as_of, data_status, last_updated" as const;

export const STOCK_FACTS_CACHE_SELECT_WITH_PRICE =
  "ticker, name, category, sub_category, exchange, logo_url, market_cap, company_description, ceo, insider_transactions, insider_net_90d_usd, insider_as_of, price_history_12m, data_status, last_updated" as const;

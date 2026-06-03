/** PostgREST / Postgres error when migration 021 not applied yet. */
export function isMissingPriceHistoryColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /price_history_12m/i.test(error.message ?? "");
}

export const STOCK_FACTS_CACHE_SELECT_BASE =
  "ticker, name, category, sub_category, exchange, logo_url, market_cap, company_description, ceo, insider_transactions, insider_net_90d_usd, insider_as_of, data_status, last_updated";

export const STOCK_FACTS_CACHE_SELECT_WITH_PRICE =
  `${STOCK_FACTS_CACHE_SELECT_BASE}, price_history_12m`;

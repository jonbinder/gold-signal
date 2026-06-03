-- Trailing 12-month daily closes for /stocks/[ticker] price chart (background refresh only)

ALTER TABLE stock_data_cache
  ADD COLUMN IF NOT EXISTS price_history_12m JSONB;

COMMENT ON COLUMN stock_data_cache.price_history_12m IS
  'Compact daily closes [{d: YYYY-MM-DD, c: close}] for trailing ~12 months; populated by refresh-stocks.';

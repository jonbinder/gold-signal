-- Trailing and forward PE cached with market cap (daily refresh)

ALTER TABLE stock_data_cache
  ADD COLUMN IF NOT EXISTS forward_pe_ratio NUMERIC;

CREATE INDEX IF NOT EXISTS idx_stock_data_forward_pe
  ON stock_data_cache (forward_pe_ratio DESC NULLS LAST);

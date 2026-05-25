-- Cached stock universe for /stocks page (daily refresh via API)

CREATE TABLE stock_data_cache (
  ticker TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  exchange TEXT,
  logo_url TEXT,
  price NUMERIC,
  previous_close NUMERIC,
  daily_change_pct NUMERIC,
  market_cap NUMERIC,
  pe_ratio NUMERIC,
  pct_above_52_week_low NUMERIC,
  signal_score INTEGER,
  institutional_score INTEGER,
  insider_score INTEGER,
  pe_score INTEGER,
  famous_investor_score INTEGER,
  support_score INTEGER,
  correlation_score INTEGER,
  fcf_yield_score INTEGER,
  signal_coverage INTEGER,
  raw_metrics JSONB,
  data_status TEXT DEFAULT 'pending' CHECK (data_status IN ('healthy', 'partial', 'error', 'pending')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

CREATE INDEX idx_stock_data_signal_score ON stock_data_cache(signal_score DESC NULLS LAST);
CREATE INDEX idx_stock_data_category ON stock_data_cache(category);
CREATE INDEX idx_stock_data_market_cap ON stock_data_cache(market_cap DESC NULLS LAST);
CREATE INDEX idx_stock_data_last_updated ON stock_data_cache(last_updated);

ALTER TABLE stock_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON stock_data_cache
  FOR SELECT
  USING (true);

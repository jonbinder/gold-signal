-- Run once in Supabase SQL Editor (production) before npm run sync:stock-cache

CREATE TABLE IF NOT EXISTS stock_data_cache (
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

ALTER TABLE stock_data_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stock_data_cache' AND policyname = 'Public read access'
  ) THEN
    CREATE POLICY "Public read access" ON stock_data_cache FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE stock_data_cache
  ADD COLUMN IF NOT EXISTS famous_holder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS famous_holders JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS insider_transactions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS insider_net_90d_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS insider_as_of TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS ceo TEXT,
  ADD COLUMN IF NOT EXISTS forward_pe_ratio NUMERIC;

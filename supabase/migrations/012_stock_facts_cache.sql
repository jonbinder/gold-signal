-- Facts layer for Dataroma-style stock pages (holders + insider transactions)

ALTER TABLE stock_data_cache
  ADD COLUMN IF NOT EXISTS famous_holder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS famous_holders JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS insider_transactions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS insider_net_90d_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS insider_as_of TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS ceo TEXT;

CREATE INDEX IF NOT EXISTS idx_stock_data_famous_holder_count
  ON stock_data_cache (famous_holder_count DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_stock_data_insider_net_90d
  ON stock_data_cache (insider_net_90d_usd DESC NULLS LAST);

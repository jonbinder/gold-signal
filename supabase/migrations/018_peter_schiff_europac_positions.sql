-- Add public attribution context for investor pages and seed Peter Schiff's
-- EuroPac Gold Fund top holdings as published sourced positions.

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS context_note TEXT;

-- Allow a dedicated type for sourced fund top-holdings references.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'investor_positions'
      AND constraint_name = 'investor_positions_position_type_check'
  ) THEN
    ALTER TABLE investor_positions DROP CONSTRAINT investor_positions_position_type_check;
  END IF;
END $$;

ALTER TABLE investor_positions
  ADD CONSTRAINT investor_positions_position_type_check
  CHECK (
    position_type IN (
      'stake_filing',
      'insider_form4',
      'fund_13f',
      'fund_holding',
      'public_statement',
      'other_disclosure'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_investor_position_source
  ON investor_positions (investor_id, ticker, source_type, source_detail, as_of_date);

UPDATE investors
SET
  context_note = 'Holdings below are the top positions of the EuroPac Gold Fund (EPGFX / EPGIX), offered by Peter Schiff''s firm Euro Pacific Asset Management and managed by portfolio manager Adrian Day. Figures are the fund''s reported top-10 holdings as of September 30, 2025 (source: fund fact sheet, europacificfunds.com). This reflects the fund Schiff promotes, not a personal portfolio.',
  is_published = true,
  needs_review = false,
  updated_at = NOW()
WHERE slug = 'peter-schiff';

INSERT INTO investor_positions (
  investor_id,
  ticker,
  company_name,
  position_type,
  detail,
  approx_size,
  source_type,
  source_detail,
  as_of_date,
  why_interesting,
  is_published,
  needs_review
)
SELECT
  i.id,
  p.ticker,
  p.company_name,
  'fund_holding',
  'Top-10 holding in EuroPac Gold Fund',
  p.approx_size,
  'EuroPac Gold Fund fact sheet',
  'EuroPac Gold Fund (EPGFX/EPGIX) top-10 holdings, europacificfunds.com',
  DATE '2025-09-30',
  NULL,
  true,
  false
FROM investors i
JOIN (
  VALUES
    ('AEM', 'Agnico Eagle Mines', '8.1%'),
    ('OR', 'OR Royalties (Osisko)', '7.3%'),
    ('FSM', 'Fortuna Mining', '6.8%'),
    ('MTA', 'Metalla Royalty & Streaming', '6.1%'),
    ('PAAS', 'Pan American Silver', '5.8%'),
    ('BTG', 'B2Gold', '5.4%'),
    ('GOLD', 'Barrick Mining', '5.3%'),
    ('WPM', 'Wheaton Precious Metals', '5.2%'),
    ('FNV', 'Franco-Nevada', '5.2%'),
    ('RGLD', 'Royal Gold', '5.2%')
) AS p(ticker, company_name, approx_size) ON TRUE
WHERE i.slug = 'peter-schiff'
ON CONFLICT (investor_id, ticker, source_type, source_detail, as_of_date)
DO UPDATE SET
  company_name = EXCLUDED.company_name,
  position_type = EXCLUDED.position_type,
  detail = EXCLUDED.detail,
  approx_size = EXCLUDED.approx_size,
  is_published = true,
  needs_review = false,
  updated_at = NOW();

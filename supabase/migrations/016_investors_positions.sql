-- Investors curation model: published investor profiles + sourced notable positions.

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS investor_type TEXT CHECK (investor_type IN ('individual', 'fund')),
  ADD COLUMN IF NOT EXISTS title_role TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

UPDATE investors
SET investor_type = COALESCE(investor_type, 'fund')
WHERE investor_type IS NULL;

CREATE TABLE IF NOT EXISTS investor_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK (
    position_type IN (
      'stake_filing',
      'insider_form4',
      'fund_13f',
      'public_statement',
      'other_disclosure'
    )
  ),
  detail TEXT NOT NULL,
  approx_size TEXT,
  source_type TEXT NOT NULL,
  source_detail TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  why_interesting TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investor_positions_investor_id
  ON investor_positions (investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_positions_ticker
  ON investor_positions (ticker);
CREATE INDEX IF NOT EXISTS idx_investor_positions_published
  ON investor_positions (is_published, as_of_date DESC);

ALTER TABLE investor_positions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'investor_positions'
      AND policyname = 'public_read_investor_positions'
  ) THEN
    CREATE POLICY "public_read_investor_positions"
      ON investor_positions
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Seed required investor profiles
INSERT INTO investors (
  slug,
  name,
  investor_type,
  title_role,
  bio,
  photo_url,
  website,
  website_url,
  cik,
  focus_note,
  sort_order,
  is_published,
  is_active
) VALUES
  (
    'sprott-inc',
    'Sprott Inc.',
    'fund',
    'Precious-metals focused investment firm',
    'A major precious-metals focused manager with dedicated gold, silver, and real-assets strategies.',
    null,
    'https://sprott.com',
    'https://sprott.com',
    '0001512920',
    '13F filer; notable precious-metals exposure.',
    10,
    true,
    true
  ),
  (
    'asa-gold-precious-metals-limited',
    'ASA Gold and Precious Metals Limited',
    'fund',
    'Closed-end precious-metals fund',
    'A long-running closed-end fund focused on gold and precious-metals equities.',
    null,
    'https://www.asaltd.com',
    'https://www.asaltd.com',
    '0001230869',
    '13F filer dedicated to gold and precious-metals positions.',
    20,
    true,
    true
  ),
  (
    'eric-sprott',
    'Eric Sprott',
    'individual',
    'Legendary precious-metals investor',
    'Known for concentrated precious-metals investing and public commentary on gold and silver markets.',
    null,
    null,
    null,
    null,
    'Add sourced notable holdings via admin.',
    30,
    true,
    true
  ),
  (
    'rick-rule',
    'Rick Rule',
    'individual',
    'Resource investor and educator',
    'Long-time natural-resources investor known for public interviews and conference commentary.',
    null,
    null,
    null,
    null,
    'Add sourced notable holdings via admin.',
    40,
    true,
    true
  ),
  (
    'peter-schiff',
    'Peter Schiff',
    'individual',
    'Gold-focused investor and commentator',
    'Investor and commentator known for long-term gold advocacy and macro market commentary.',
    null,
    'https://www.europac.com',
    'https://www.europac.com',
    null,
    'Add sourced notable holdings via admin.',
    50,
    true,
    true
  ),
  (
    'adrian-day',
    'Adrian Day',
    'individual',
    'Resource investor and newsletter author',
    'Resource-focused investor and publisher; track notable positions via sourced public disclosures/statements.',
    null,
    'https://www.adriandayassetmanagement.com',
    'https://www.adriandayassetmanagement.com',
    null,
    'Track as individual sourced statements (not auto-13F).',
    60,
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  investor_type = EXCLUDED.investor_type,
  title_role = EXCLUDED.title_role,
  bio = EXCLUDED.bio,
  photo_url = EXCLUDED.photo_url,
  website = EXCLUDED.website,
  website_url = COALESCE(EXCLUDED.website_url, investors.website_url),
  cik = EXCLUDED.cik,
  focus_note = EXCLUDED.focus_note,
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published,
  is_active = true;

-- Draft placeholders for individual profiles (intentionally unpublished)
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
  is_published
)
SELECT
  i.id,
  'WPM',
  'Wheaton Precious Metals',
  'public_statement',
  'PLACEHOLDER — add sourced notable position via /admin before publishing.',
  null,
  'Interview',
  'PLACEHOLDER — add outlet + URL',
  CURRENT_DATE,
  'Replace with educator context once sourced.',
  false
FROM investors i
WHERE i.slug IN ('eric-sprott', 'rick-rule', 'peter-schiff', 'adrian-day')
  AND NOT EXISTS (
    SELECT 1 FROM investor_positions p WHERE p.investor_id = i.id
  );

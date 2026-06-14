-- Trim investors to the final tracked roster (14 canonical slugs; sprott-asset-management-funds merges into sprott-inc).
-- holdings and investor_positions cascade on investor delete (ON DELETE CASCADE).

-- ── Merge duplicate Sprott institutional slugs into sprott-inc ──
DO $$
DECLARE
  keep_id uuid;
  dup_id uuid;
  dup_slug text;
BEGIN
  SELECT id INTO keep_id FROM investors WHERE slug = 'sprott-inc' LIMIT 1;

  FOR dup_slug IN SELECT unnest(ARRAY['sprott-asset-management-funds', 'sprott-asset-management']) LOOP
    SELECT id INTO dup_id FROM investors WHERE slug = dup_slug LIMIT 1;
    IF dup_id IS NULL THEN
      CONTINUE;
    END IF;

    IF keep_id IS NULL THEN
      UPDATE investors
      SET slug = 'sprott-inc', name = 'Sprott Inc.', updated_at = NOW()
      WHERE id = dup_id;
      keep_id := dup_id;
    ELSIF dup_id <> keep_id THEN
      UPDATE investor_positions SET investor_id = keep_id WHERE investor_id = dup_id;
      UPDATE holdings SET investor_id = keep_id WHERE investor_id = dup_id;
      DELETE FROM investors WHERE id = dup_id;
    END IF;
  END LOOP;
END $$;

-- ── Upsert missing roster investors (skip rows that already exist) ──
INSERT INTO investors (
  slug,
  name,
  investor_type,
  title_role,
  bio,
  website,
  website_url,
  sort_order,
  is_published,
  is_active
) VALUES
  (
    'garrett-goggin',
    'Garrett Goggin',
    'individual',
    'CFA / Portfolio Manager',
    'Precious-metals focused portfolio manager and analyst.',
    NULL,
    NULL,
    5,
    true,
    true
  ),
  (
    'jon-binder',
    'Jon Binder',
    'individual',
    'Founder, GoldSignal.ai',
    'Personal precious metals portfolio tracked since 2018. Positions are hand-curated and updated by Jon directly.',
    'https://goldsignal.ai',
    'https://goldsignal.ai',
    55,
    true,
    true
  ),
  (
    'don-durrett',
    'Don Durrett',
    'individual',
    'Analyst, GoldStockData.com',
    'Gold stock analyst and author focused on undervalued precious-metals miners.',
    'https://goldstockdata.com',
    'https://goldstockdata.com',
    65,
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  title_role = COALESCE(investors.title_role, EXCLUDED.title_role),
  bio = COALESCE(investors.bio, EXCLUDED.bio),
  website = COALESCE(investors.website, EXCLUDED.website),
  website_url = COALESCE(investors.website_url, EXCLUDED.website_url),
  is_published = true,
  is_active = true,
  updated_at = NOW();

-- Ensure sprott-inc metadata
UPDATE investors
SET
  name = 'Sprott Inc.',
  investor_type = COALESCE(investor_type, 'fund'),
  title_role = COALESCE(title_role, 'Asset Manager (TSX: SII)'),
  is_published = true,
  is_active = true,
  updated_at = NOW()
WHERE slug = 'sprott-inc';

-- ── Remove investors outside the tracked roster ──
DELETE FROM investors
WHERE slug NOT IN (
  'garrett-goggin',
  'adrian-day',
  'ross-beaty',
  'eric-sprott',
  'peter-schiff',
  'rick-rule',
  'sprott-inc',
  'jon-binder',
  'lawrence-lepard',
  'frank-giustra',
  'rob-mcewen',
  'pierre-lassonde',
  'doug-casey',
  'don-durrett'
);

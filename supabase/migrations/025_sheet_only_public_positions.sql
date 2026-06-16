-- Keep seed/admin placeholder rows in DB but off public reads (filtered by google_sheet_synced).

UPDATE investor_positions
SET
  google_sheet_synced = false,
  is_published = false,
  needs_review = true,
  updated_at = NOW()
WHERE detail ILIKE '%PLACEHOLDER%'
   OR source_detail ILIKE '%PLACEHOLDER%'
   OR COALESCE(why_interesting, '') ILIKE '%PLACEHOLDER%';

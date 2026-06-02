-- Publish-first defaults for investors and sourced positions.
-- Also clear existing draft/review flags in-place.

UPDATE investors
SET
  is_published = true,
  needs_review = false,
  updated_at = NOW()
WHERE is_published IS DISTINCT FROM true
   OR needs_review IS DISTINCT FROM false;

UPDATE investor_positions
SET
  is_published = true,
  needs_review = false,
  updated_at = NOW()
WHERE is_published IS DISTINCT FROM true
   OR needs_review IS DISTINCT FROM false;

ALTER TABLE investors
  ALTER COLUMN is_published SET DEFAULT true,
  ALTER COLUMN needs_review SET DEFAULT false;

ALTER TABLE investor_positions
  ALTER COLUMN is_published SET DEFAULT true,
  ALTER COLUMN needs_review SET DEFAULT false;

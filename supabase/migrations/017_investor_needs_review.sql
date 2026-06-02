-- Draft-review support for curated investor records.

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE investor_positions
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_investors_review
  ON investors (is_published, needs_review, sort_order);

CREATE INDEX IF NOT EXISTS idx_investor_positions_review
  ON investor_positions (is_published, needs_review, as_of_date DESC);

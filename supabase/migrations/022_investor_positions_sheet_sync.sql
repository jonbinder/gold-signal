-- Google Sheets sync: optional source URL + mark rows managed by sheet cron

ALTER TABLE investor_positions
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS google_sheet_synced BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_investor_positions_sheet_synced
  ON investor_positions (google_sheet_synced)
  WHERE google_sheet_synced = true;

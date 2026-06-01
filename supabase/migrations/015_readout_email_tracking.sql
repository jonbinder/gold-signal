-- Filing readout email delivery tracking (lead magnet)

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS readout_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS readout_email_id TEXT;

ALTER TABLE watchlist_signups
  ADD COLUMN IF NOT EXISTS readout_submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS readout_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_submissions_readout_sent_at ON submissions (readout_sent_at DESC NULLS LAST);

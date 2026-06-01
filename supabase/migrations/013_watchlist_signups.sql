-- Homepage email capture (stocks you're watching)

CREATE TABLE watchlist_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  stocks_watching TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watchlist_signups_created_at ON watchlist_signups (created_at DESC);
CREATE INDEX idx_watchlist_signups_email ON watchlist_signups (email);

ALTER TABLE watchlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert watchlist signups"
  ON watchlist_signups
  FOR INSERT
  WITH CHECK (true);

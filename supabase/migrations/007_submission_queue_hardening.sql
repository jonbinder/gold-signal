-- Queue hardening: atomic processing tracking + prevent duplicate rankings per ticker

alter table submissions
  add column if not exists processing_started_at timestamptz;

create unique index if not exists stock_rankings_submission_ticker_unique
  on stock_rankings (submission_id, ticker);

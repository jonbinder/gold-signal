-- Portfolio review submissions (SignalScore report pipeline)

-- ─────────────────────────────────────────────
-- SUBMISSIONS
-- ─────────────────────────────────────────────
create table submissions (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text not null,
  tickers          text[] not null,
  status           text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  pdf_url          text,
  portfolio_score  integer,
  portfolio_grade  text,
  error_message    text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index idx_submissions_status on submissions (status);
create index idx_submissions_created_at on submissions (created_at desc);

-- ─────────────────────────────────────────────
-- STOCK RANKINGS (per submission, per ticker)
-- ─────────────────────────────────────────────
create table stock_rankings (
  id                      uuid primary key default gen_random_uuid(),
  submission_id           uuid not null references submissions (id) on delete cascade,
  ticker                  text not null,
  company_name            text,
  signal_score            integer not null check (signal_score >= 0 and signal_score <= 100),
  institutional_score     integer check (institutional_score >= 0 and institutional_score <= 100),
  insider_score           integer check (insider_score >= 0 and insider_score <= 100),
  pe_score                integer check (pe_score >= 0 and pe_score <= 100),
  famous_investor_score   integer check (famous_investor_score >= 0 and famous_investor_score <= 100),
  support_score           integer check (support_score >= 0 and support_score <= 100),
  correlation_score       integer check (correlation_score >= 0 and correlation_score <= 100),
  fcf_yield_score         integer check (fcf_yield_score >= 0 and fcf_yield_score <= 100),
  raw_metrics             jsonb,
  created_at              timestamptz not null default now()
);

create index idx_stock_rankings_submission_id on stock_rankings (submission_id);

-- ─────────────────────────────────────────────
-- FAMOUS INVESTORS (manual 13F-style holdings list)
-- ─────────────────────────────────────────────
create table famous_investors (
  id                 uuid primary key default gen_random_uuid(),
  investor_name      text not null,
  ticker             text not null,
  position_size_usd  numeric,
  last_updated       date not null default current_date
);

create index idx_famous_investors_ticker on famous_investors (ticker);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (no public write; API uses service role)
-- ─────────────────────────────────────────────
alter table submissions enable row level security;
alter table stock_rankings enable row level security;
alter table famous_investors enable row level security;

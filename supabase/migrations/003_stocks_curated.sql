-- Curated gold & silver universe for /gold-silver-stocks (seed via migration 004 or app fallback)
create table if not exists stocks (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null unique,
  name            text not null,
  category        text not null
    check (category in (
      'Gold Producer',
      'Silver Producer',
      'Junior Explorer',
      'Royalty/Streaming',
      'ETF'
    )),
  exchange        text not null default 'NYSE',
  market_cap_usd  bigint,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_stocks_category on stocks (category);
create index if not exists idx_stocks_exchange on stocks (exchange);
create index if not exists idx_stocks_active_ticker on stocks (is_active, ticker);

alter table stocks enable row level security;

create policy "public_read_stocks"
  on stocks
  for select
  using (true);

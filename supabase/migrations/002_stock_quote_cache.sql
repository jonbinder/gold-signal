-- Short-lived live quotes from Polygon / Yahoo (server-side cache)
create table if not exists stock_quote_cache (
  ticker     text primary key,
  price      numeric(18, 8) not null,
  currency   text not null default 'USD',
  source     text not null,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_stock_quote_cache_fetched_at on stock_quote_cache (fetched_at desc);

alter table stock_quote_cache enable row level security;

-- Public read (same pattern as other reference tables). Writes use service role (bypasses RLS).
create policy "public_read_stock_quote_cache"
  on stock_quote_cache
  for select
  using (true);

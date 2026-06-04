-- Trailing returns for Top Movers (computed in refresh job from price_history_12m)
alter table stock_data_cache
  add column if not exists return_1m_pct numeric,
  add column if not exists return_3m_pct numeric,
  add column if not exists return_1y_pct numeric;

create index if not exists idx_stock_data_return_3m
  on stock_data_cache (return_3m_pct desc nulls last);

-- Homepage metals strip (GLD / SLV proxies + ratio) — single row, written by refresh job
create table if not exists metals_market_cache (
  id int primary key default 1 check (id = 1),
  gold_price numeric,
  gold_change_pct numeric,
  silver_price numeric,
  silver_change_pct numeric,
  gold_silver_ratio numeric,
  ratio_change_pct numeric,
  gold_label text not null default 'Gold (GLD)',
  silver_label text not null default 'Silver (SLV)',
  updated_at timestamptz not null default now()
);

alter table metals_market_cache enable row level security;

create policy "public_read_metals_market_cache"
  on metals_market_cache
  for select
  using (true);

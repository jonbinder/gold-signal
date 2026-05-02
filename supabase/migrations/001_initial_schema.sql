-- GoldSignal Database Schema
-- 13F-style holdings tracker for gold/silver fund managers

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- INVESTORS (fund managers / firms)
-- ─────────────────────────────────────────────
create table investors (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,          -- e.g. "sprott-asset-management"
  name         text not null,                 -- e.g. "Sprott Asset Management"
  firm         text,                          -- parent firm name if different
  bio          text,
  aum_usd      bigint,                        -- assets under management in USD
  focus        text[] default '{}',           -- ["gold","silver","royalties","streaming"]
  website_url  text,
  logo_url     text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────────
-- SECURITIES (gold/silver miners & royalty cos)
-- ─────────────────────────────────────────────
create table securities (
  id           uuid primary key default uuid_generate_v4(),
  ticker       text not null,                 -- e.g. "NEM", "AEM", "WPM"
  exchange     text not null,                 -- "NYSE", "TSX", "NYSEARCA"
  name         text not null,                 -- "Newmont Corporation"
  sector       text,                          -- "Gold Miner", "Silver Miner", "Royalty/Streaming", "ETF"
  sub_sector   text,                          -- "Senior Producer", "Junior Miner", "Explorer"
  country      text,                          -- "USA", "Canada", "Australia"
  market_cap   bigint,                        -- in USD
  logo_url     text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  unique(ticker, exchange)
);

-- ─────────────────────────────────────────────
-- REPORTING PERIODS (13F filing quarters)
-- ─────────────────────────────────────────────
create table reporting_periods (
  id           uuid primary key default uuid_generate_v4(),
  label        text not null unique,          -- "Q4 2024", "Q1 2025"
  period_end   date not null,                 -- last day of quarter
  filing_due   date,                          -- 45 days after quarter end
  is_latest    boolean default false,
  created_at   timestamptz default now()
);

-- Only one period can be latest
create unique index one_latest_period on reporting_periods (is_latest) where is_latest = true;

-- ─────────────────────────────────────────────
-- HOLDINGS (core 13F data)
-- ─────────────────────────────────────────────
create table holdings (
  id                uuid primary key default uuid_generate_v4(),
  investor_id       uuid not null references investors(id) on delete cascade,
  security_id       uuid not null references securities(id) on delete cascade,
  period_id         uuid not null references reporting_periods(id) on delete cascade,

  -- Position data
  shares            bigint not null,           -- number of shares held
  value_usd         bigint not null,           -- market value in USD (from 13F)
  portfolio_pct     numeric(5,2),              -- % of this investor's total portfolio

  -- Change tracking vs prior period
  shares_prev       bigint,                    -- shares held prior period
  value_prev_usd    bigint,
  change_type       text check (change_type in ('new','add','reduce','sell','unchanged')),
  change_pct        numeric(7,2),              -- percentage change in shares

  created_at        timestamptz default now(),
  unique(investor_id, security_id, period_id)
);

-- ─────────────────────────────────────────────
-- LEADERBOARD (materialized view style table)
-- Refreshed on data import, stores aggregate ownership stats
-- ─────────────────────────────────────────────
create table security_ownership_stats (
  id              uuid primary key default uuid_generate_v4(),
  security_id     uuid not null references securities(id) on delete cascade,
  period_id       uuid not null references reporting_periods(id) on delete cascade,

  owner_count     int default 0,              -- # of tracked managers owning this
  total_shares    bigint default 0,           -- total shares across all managers
  total_value_usd bigint default 0,           -- total value across all managers
  new_buyers      int default 0,              -- managers who initiated position
  sellers         int default 0,              -- managers who fully exited

  updated_at      timestamptz default now(),
  unique(security_id, period_id)
);

-- ─────────────────────────────────────────────
-- PRICE SNAPSHOTS (for sparklines / % gain)
-- ─────────────────────────────────────────────
create table price_snapshots (
  id           uuid primary key default uuid_generate_v4(),
  security_id  uuid not null references securities(id) on delete cascade,
  price_date   date not null,
  close_price  numeric(12,4) not null,
  currency     text default 'USD',
  unique(security_id, price_date)
);

-- ─────────────────────────────────────────────
-- INDEXES for common query patterns
-- ─────────────────────────────────────────────
create index idx_holdings_investor   on holdings(investor_id);
create index idx_holdings_security   on holdings(security_id);
create index idx_holdings_period     on holdings(period_id);
create index idx_holdings_value      on holdings(value_usd desc);
create index idx_securities_ticker   on securities(ticker);
create index idx_ownership_period    on security_ownership_stats(period_id);
create index idx_prices_security     on price_snapshots(security_id, price_date desc);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table investors               enable row level security;
alter table securities              enable row level security;
alter table reporting_periods       enable row level security;
alter table holdings                enable row level security;
alter table security_ownership_stats enable row level security;
alter table price_snapshots         enable row level security;

-- Public read access (all data is public like Dataroma)
create policy "public_read_investors"    on investors               for select using (true);
create policy "public_read_securities"   on securities              for select using (true);
create policy "public_read_periods"      on reporting_periods       for select using (true);
create policy "public_read_holdings"     on holdings                for select using (true);
create policy "public_read_ownership"    on security_ownership_stats for select using (true);
create policy "public_read_prices"       on price_snapshots         for select using (true);

-- ─────────────────────────────────────────────
-- SEED DATA — Reporting periods
-- ─────────────────────────────────────────────
insert into reporting_periods (label, period_end, filing_due, is_latest) values
  ('Q1 2024', '2024-03-31', '2024-05-15', false),
  ('Q2 2024', '2024-06-30', '2024-08-14', false),
  ('Q3 2024', '2024-09-30', '2024-11-14', false),
  ('Q4 2024', '2024-12-31', '2025-02-14', false),
  ('Q1 2025', '2025-03-31', '2025-05-15', true);

-- ─────────────────────────────────────────────
-- SEED DATA — Core gold/silver universe
-- ─────────────────────────────────────────────
insert into securities (ticker, exchange, name, sector, sub_sector, country) values
  -- Senior Gold Miners
  ('NEM',  'NYSE',    'Newmont Corporation',          'Gold Miner', 'Senior Producer', 'USA'),
  ('AEM',  'NYSE',    'Agnico Eagle Mines',           'Gold Miner', 'Senior Producer', 'Canada'),
  ('GOLD', 'NYSE',    'Barrick Gold Corporation',     'Gold Miner', 'Senior Producer', 'Canada'),
  ('KGC',  'NYSE',    'Kinross Gold Corporation',     'Gold Miner', 'Senior Producer', 'Canada'),
  ('AU',   'NYSE',    'AngloGold Ashanti',            'Gold Miner', 'Senior Producer', 'South Africa'),
  ('GFI',  'NYSE',    'Gold Fields Limited',          'Gold Miner', 'Senior Producer', 'South Africa'),
  -- Mid-Tier Gold Miners
  ('EGO',  'NYSE',    'Eldorado Gold Corporation',    'Gold Miner', 'Mid-Tier',        'Canada'),
  ('IAG',  'NYSE',    'IAMGOLD Corporation',          'Gold Miner', 'Mid-Tier',        'Canada'),
  ('BTG',  'NYSE',    'B2Gold Corp',                  'Gold Miner', 'Mid-Tier',        'Canada'),
  ('CDE',  'NYSE',    'Coeur Mining',                 'Gold Miner', 'Mid-Tier',        'USA'),
  ('HL',   'NYSE',    'Hecla Mining Company',         'Silver Miner','Mid-Tier',       'USA'),
  -- Silver Miners
  ('PAAS', 'NASDAQ',  'Pan American Silver Corp',     'Silver Miner','Senior Producer','Canada'),
  ('AG',   'NYSE',    'First Majestic Silver',        'Silver Miner','Mid-Tier',       'Canada'),
  ('MAG',  'NYSE',    'MAG Silver Corp',              'Silver Miner','Mid-Tier',       'Canada'),
  -- Royalty & Streaming
  ('WPM',  'NYSE',    'Wheaton Precious Metals',      'Royalty/Streaming','Streaming', 'Canada'),
  ('RGLD', 'NASDAQ',  'Royal Gold Inc',               'Royalty/Streaming','Royalty',   'USA'),
  ('FNV',  'NYSE',    'Franco-Nevada Corporation',    'Royalty/Streaming','Royalty',   'Canada'),
  ('OR',   'NYSE',    'Osisko Gold Royalties',        'Royalty/Streaming','Royalty',   'Canada'),
  ('SAND', 'NYSE',    'Sandstorm Gold Royalties',     'Royalty/Streaming','Royalty',   'Canada'),
  -- ETFs
  ('GDX',  'NYSEARCA','VanEck Gold Miners ETF',       'ETF',         'Senior ETF',    'USA'),
  ('GDXJ', 'NYSEARCA','VanEck Junior Gold Miners ETF','ETF',         'Junior ETF',    'USA'),
  ('SIL',  'NYSEARCA','Global X Silver Miners ETF',   'ETF',         'Silver ETF',    'USA');

-- ─────────────────────────────────────────────
-- SEED DATA — Initial fund managers
-- ─────────────────────────────────────────────
insert into investors (slug, name, firm, bio, focus) values
  ('sprott-asset-management', 'Sprott Asset Management', 'Sprott Inc.', 
   'One of the world''s largest dedicated precious metals and critical materials fund managers.', 
   ARRAY['gold','silver','royalties']),
  ('first-eagle-investments', 'First Eagle Investment Management', 'First Eagle', 
   'Value-oriented manager with significant gold holdings as portfolio hedge.', 
   ARRAY['gold','value']),
  ('van-eck-associates', 'VanEck Associates', 'VanEck', 
   'Pioneer in gold mining equity ETFs and active precious metals strategies.', 
   ARRAY['gold','silver','etf']),
  ('tocqueville-asset-management', 'Tocqueville Asset Management', 'Tocqueville', 
   'Known for the Tocqueville Gold Fund, a long-running precious metals vehicle.', 
   ARRAY['gold','silver']),
  ('baker-steel-capital', 'Baker Steel Capital Managers', 'Baker Steel', 
   'London-based specialist manager focused exclusively on gold and precious metals equities.', 
   ARRAY['gold','silver','platinum']);

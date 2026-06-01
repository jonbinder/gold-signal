-- CIK-driven 13F filers (curated funds in data/funds.json)
alter table investors
  add column if not exists cik text,
  add column if not exists manager_name text,
  add column if not exists focus_note text;

create unique index if not exists investors_cik_unique on investors (cik) where cik is not null;

comment on column investors.cik is 'SEC CIK (zero-padded or digits) for 13F-HR filer';
comment on column investors.manager_name is 'Lead portfolio manager, if known';
comment on column investors.focus_note is 'Short focus description for fund profile';

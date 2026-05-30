-- Allow null signal_score when no smart-money footprints are available (scoring v3).

alter table stock_rankings
  alter column signal_score drop not null;

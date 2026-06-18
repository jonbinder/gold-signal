-- CSV (data/GS-Investors.csv) is the sole source of truth for investor positions.
-- Positions are repopulated by npm run investors:sync at build time.

DELETE FROM investor_positions;

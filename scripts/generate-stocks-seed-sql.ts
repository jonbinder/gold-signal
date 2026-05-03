/**
 * Writes supabase/migrations/004_stocks_seed.sql from GOLD_SILVER_STOCK_SEED.
 * Run: npm run db:generate-stocks-seed
 */
import fs from "fs";
import path from "path";
import { GOLD_SILVER_STOCK_SEED } from "../src/lib/gold-silver-stocks-seed-data";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

const rows = GOLD_SILVER_STOCK_SEED.map(
  (r) =>
    `('${esc(r.ticker)}','${esc(r.name)}','${esc(r.category)}','${esc(r.exchange)}',${r.market_cap_usd === null ? "null" : r.market_cap_usd},${r.is_active})`,
);

const sql = `-- Seed curated gold & silver stocks (generated; do not edit by hand)
insert into stocks (ticker, name, category, exchange, market_cap_usd, is_active)
values
${rows.join(",\n")}
on conflict (ticker) do update set
  name = excluded.name,
  category = excluded.category,
  exchange = excluded.exchange,
  market_cap_usd = excluded.market_cap_usd,
  is_active = excluded.is_active;
`;

const out = path.join(process.cwd(), "supabase/migrations/004_stocks_seed.sql");
fs.writeFileSync(out, sql, "utf8");
console.log("Wrote", out, "rows:", GOLD_SILVER_STOCK_SEED.length);

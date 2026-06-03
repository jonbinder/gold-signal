import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { loadTrackedStocksSync } from "../src/lib/tracked-stocks-load";
import { normalizeTicker } from "../src/lib/polygon";
import { createSupabaseServiceClient } from "../src/lib/supabase";

async function main() {
  const expected = [...new Set(loadTrackedStocksSync().map((s) => normalizeTicker(s.ticker)).filter(Boolean))].sort();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Supabase not configured");
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("stock_data_cache")
    .select("ticker, name, market_cap, pe_ratio, forward_pe_ratio, famous_holder_count, last_updated")
    .in("ticker", expected);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []).sort((a, b) => a.ticker.localeCompare(b.ticker));
  const found = new Set(rows.map((r) => normalizeTicker(r.ticker)));

  console.log(`Expected ${expected.length} tickers, found ${rows.length} rows.\n`);
  console.log("ticker | market_cap | pe | fwd_pe | holders | updated");
  console.log("-".repeat(72));

  let complete = 0;
  for (const t of expected) {
    const row = rows.find((r) => normalizeTicker(r.ticker) === t);
    if (!row) {
      console.log(`${t} | MISSING ROW`);
      continue;
    }
    const cap = row.market_cap != null && row.market_cap > 0;
    const pe = row.pe_ratio != null && row.pe_ratio > 0;
    const fpe = row.forward_pe_ratio != null && row.forward_pe_ratio > 0;
    const holders = row.famous_holder_count != null;
    const ok = cap && pe && fpe && holders;
    if (ok) complete++;

    console.log(
      [
        t.padEnd(6),
        cap ? `$${Math.round(row.market_cap! / 1e6)}M`.padStart(8) : "—".padStart(8),
        pe ? String(row.pe_ratio).padStart(6) : "—".padStart(6),
        fpe ? String(row.forward_pe_ratio).padStart(7) : "—".padStart(7),
        holders ? String(row.famous_holder_count).padStart(7) : "—".padStart(7),
        row.last_updated?.slice(0, 10) ?? "—",
      ].join(" | "),
    );
  }

  const missing = expected.filter((t) => !found.has(t));
  if (missing.length) console.log("\nMissing tickers:", missing.join(", "));

  console.log(`\nFully populated (cap+PE+fwd+holders): ${complete}/${expected.length}`);
  process.exit(complete === expected.length && missing.length === 0 ? 0 : 1);
}

main();

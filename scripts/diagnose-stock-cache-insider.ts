/**
 * Diagnose stock_data_cache insider rows (production vs missing column).
 * Run: npx tsx scripts/diagnose-stock-cache-insider.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const TICKERS = ["RGLD", "WPM", "FNV"];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const fullSelect =
    "ticker, insider_transactions, insider_net_90d_usd, insider_as_of, price_history_12m, data_status, last_updated";
  const baseSelect =
    "ticker, insider_transactions, insider_net_90d_usd, insider_as_of, data_status, last_updated";

  for (const ticker of TICKERS) {
    console.log(`\n=== ${ticker} ===`);
    for (const [label, sel] of [
      ["page select (with price_history_12m)", fullSelect],
      ["fallback select", baseSelect],
    ] as const) {
      const { data, error } = await supabase.from("stock_data_cache").select(sel).eq("ticker", ticker).maybeSingle();
      if (error) {
        console.log(`  ${label}: ERROR ${error.message} (${error.code})`);
        continue;
      }
      const n = Array.isArray(data?.insider_transactions) ? data.insider_transactions.length : 0;
      const pricePts = Array.isArray((data as { price_history_12m?: unknown })?.price_history_12m)
        ? (data as { price_history_12m: unknown[] }).price_history_12m.length
        : "n/a";
      console.log(`  ${label}: row=${!!data} insider_tx=${n} price_pts=${pricePts} last_updated=${data?.last_updated ?? "null"}`);
      if (n > 0 && Array.isArray(data?.insider_transactions)) {
        const first = data.insider_transactions[0] as { type?: string; date?: string; name?: string };
        console.log(`    sample: ${first.type} ${first.date} ${first.name}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

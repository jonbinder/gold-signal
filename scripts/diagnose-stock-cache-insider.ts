/**
 * Diagnose stock_data_cache insider rows (production vs missing column).
 * Run: npx tsx scripts/diagnose-stock-cache-insider.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  STOCK_FACTS_CACHE_SELECT_BASE,
  STOCK_FACTS_CACHE_SELECT_WITH_PRICE,
} from "../src/lib/stock-cache-columns";

const TICKERS = ["RGLD", "WPM", "FNV"];

type CacheProbeRow = {
  ticker?: string;
  insider_transactions?: unknown;
  price_history_12m?: unknown;
  last_updated?: string | null;
};

function logRow(label: string, data: CacheProbeRow | null) {
  const n = Array.isArray(data?.insider_transactions) ? data.insider_transactions.length : 0;
  const pricePts = Array.isArray(data?.price_history_12m) ? data.price_history_12m.length : "n/a";
  console.log(
    `  ${label}: row=${!!data} insider_tx=${n} price_pts=${pricePts} last_updated=${data?.last_updated ?? "null"}`,
  );
  if (n > 0 && Array.isArray(data?.insider_transactions)) {
    const first = data.insider_transactions[0] as { type?: string; date?: string; name?: string };
    console.log(`    sample: ${first.type} ${first.date} ${first.name}`);
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  for (const ticker of TICKERS) {
    console.log(`\n=== ${ticker} ===`);

    const withPrice = await supabase
      .from("stock_data_cache")
      .select(STOCK_FACTS_CACHE_SELECT_WITH_PRICE)
      .eq("ticker", ticker)
      .maybeSingle();
    if (withPrice.error) {
      console.log(
        `  page select (with price_history_12m): ERROR ${withPrice.error.message} (${withPrice.error.code})`,
      );
    } else {
      logRow("page select (with price_history_12m)", withPrice.data as CacheProbeRow | null);
    }

    const base = await supabase
      .from("stock_data_cache")
      .select(STOCK_FACTS_CACHE_SELECT_BASE)
      .eq("ticker", ticker)
      .maybeSingle();
    if (base.error) {
      console.log(`  fallback select: ERROR ${base.error.message} (${base.error.code})`);
    } else {
      logRow("fallback select", base.data as CacheProbeRow | null);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

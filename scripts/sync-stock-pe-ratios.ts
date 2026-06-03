/**
 * Fetches trailing / forward PE for all tracked tickers and upserts stock_data_cache.
 * Requires POLYGON_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run: npm run sync:stock-pe
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { loadTrackedStocksSync } from "../src/lib/tracked-stocks-load";
import { normalizeTicker } from "../src/lib/polygon";
import { resolveStockPeRatios } from "../src/lib/stock-pe-ratios";
import { createSupabaseServiceClient } from "../src/lib/supabase";

async function main() {
  if (!process.env.POLYGON_API_KEY?.trim()) {
    console.error("POLYGON_API_KEY is required (server-side env var).");
    process.exit(1);
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Supabase service client not configured.");
    process.exit(1);
  }

  const tickers = [...new Set(loadTrackedStocksSync().map((s) => normalizeTicker(s.ticker)).filter(Boolean))];
  console.log(`Syncing PE ratios for ${tickers.length} tickers…`);

  let ok = 0;
  let fail = 0;

  for (const ticker of tickers) {
    try {
      const { peRatio, forwardPeRatio } = await resolveStockPeRatios(ticker);
      const { error } = await supabase
        .from("stock_data_cache")
        .upsert(
          {
            ticker,
            pe_ratio: peRatio,
            forward_pe_ratio: forwardPeRatio,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "ticker" },
        );
      if (error) throw new Error(error.message);
      console.log(
        ticker,
        peRatio != null ? `PE ${peRatio}` : "PE —",
        forwardPeRatio != null ? `Fwd ${forwardPeRatio}` : "Fwd —",
      );
      ok++;
    } catch (err) {
      fail++;
      console.warn(ticker, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done. ${ok} ok, ${fail} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

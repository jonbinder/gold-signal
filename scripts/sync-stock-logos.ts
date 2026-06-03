/**
 * Resolve Polygon branding for all tracked tickers and persist serve paths in stock_data_cache.
 * Run: npx tsx scripts/sync-stock-logos.ts
 *
 * Requires: POLYGON_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { resolveStockLogoServePath } from "../src/lib/stock-branding";
import { normalizeTicker } from "../src/lib/polygon";
import { getPolygonTickerDetails } from "../src/lib/stock-profile";
import { createSupabaseServiceClient } from "../src/lib/supabase";
import { loadTrackedStocksFile } from "../src/lib/stock-universe-refresh";

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Supabase service client not configured.");
    process.exit(1);
  }

  const stocks = loadTrackedStocksFile();
  const tickers = [...new Set(stocks.map((s) => normalizeTicker(s.ticker)).filter(Boolean))].sort();

  let withLogo = 0;
  let withoutLogo = 0;

  for (const ticker of tickers) {
    const details = await getPolygonTickerDetails(ticker);
    const logoUrl = resolveStockLogoServePath(ticker, details);

    const { error } = await supabase.from("stock_data_cache").upsert(
      {
        ticker,
        logo_url: logoUrl,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "ticker" },
    );

    if (error) {
      console.warn(`[${ticker}] cache update failed:`, error.message);
      continue;
    }

    if (logoUrl) {
      withLogo += 1;
      console.log(`[${ticker}] logo -> ${logoUrl}`);
    } else {
      withoutLogo += 1;
      console.log(`[${ticker}] no Polygon branding (letter-tile fallback)`);
    }
  }

  console.log(`\nDone. ${withLogo} with logos, ${withoutLogo} without (${tickers.length} tickers).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

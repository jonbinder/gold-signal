/**
 * Resolve Polygon branding for all tracked tickers and persist serve paths in stock_data_cache.
 * Run: npx tsx scripts/sync-stock-logos.ts
 *
 * Requires: POLYGON_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  extractPolygonBranding,
  pickPolygonBrandingImageUrl,
  stockLogoServePath,
} from "../src/lib/stock-branding";
import { getTickerDetails, normalizeTicker } from "../src/lib/polygon";
import { createSupabaseServiceClient } from "../src/lib/supabase";
import { loadTrackedStocksFile } from "../src/lib/stock-universe-refresh";
import type { TrackedStock } from "../src/lib/tracked-stocks";

async function upsertLogo(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  stock: TrackedStock,
  logoUrl: string | null,
): Promise<string | null> {
  const ticker = normalizeTicker(stock.ticker);
  const now = new Date().toISOString();

  const { data: existing, error: readErr } = await supabase
    .from("stock_data_cache")
    .select("ticker")
    .eq("ticker", ticker)
    .maybeSingle();

  if (readErr) return readErr.message;

  if (existing) {
    const { error } = await supabase
      .from("stock_data_cache")
      .update({ logo_url: logoUrl, last_updated: now })
      .eq("ticker", ticker);
    return error?.message ?? null;
  }

  const { error } = await supabase.from("stock_data_cache").insert({
    ticker,
    name: stock.name,
    category: stock.category,
    sub_category: stock.sub_category,
    exchange: stock.exchange,
    logo_url: logoUrl,
    data_status: "partial",
    last_updated: now,
  });

  return error?.message ?? null;
}

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Supabase service client not configured.");
    process.exit(1);
  }

  const { error: tableCheck } = await supabase.from("stock_data_cache").select("ticker").limit(1);
  if (tableCheck?.message?.includes("stock_data_cache")) {
    console.error(
      "Table stock_data_cache is missing. Apply supabase/migrations/008_stock_data_cache.sql (and later migrations) to your project first.",
    );
    process.exit(1);
  }

  const stocks = loadTrackedStocksFile();
  const tickers = [...new Set(stocks.map((s) => normalizeTicker(s.ticker)).filter(Boolean))].sort();

  let withLogo = 0;
  let withoutLogo = 0;
  let errors = 0;

  for (const stock of stocks) {
    const ticker = normalizeTicker(stock.ticker);
    if (!ticker) continue;

    const details = await getTickerDetails(ticker);
    const branding = details.ok ? extractPolygonBranding(details.data.raw) : null;
    const logoUrl = pickPolygonBrandingImageUrl(branding) ? stockLogoServePath(ticker) : null;
    const err = await upsertLogo(supabase, stock, logoUrl);

    if (err) {
      errors += 1;
      console.warn(`[${ticker}] failed: ${err}`);
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

  console.log(
    `\nDone. ${withLogo} with logos, ${withoutLogo} without, ${errors} errors (${tickers.length} tickers).`,
  );

  const { data: wpm } = await supabase
    .from("stock_data_cache")
    .select("ticker, logo_url")
    .eq("ticker", "WPM")
    .maybeSingle();
  console.log("WPM row after sync:", wpm);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Report Polygon branding availability per tracked ticker (no DB required).
 * Run: npx tsx scripts/report-stock-logos.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { appendPolygonApiKey, resolveStockLogoServePath } from "../src/lib/stock-branding";
import { normalizeTicker } from "../src/lib/polygon";
import { getPolygonTickerDetails } from "../src/lib/stock-profile";
import { loadTrackedStocksFile } from "../src/lib/stock-universe-refresh";

async function main() {
  const polygonKey = process.env.POLYGON_API_KEY?.trim();
  if (!polygonKey) {
    console.error("POLYGON_API_KEY missing");
    process.exit(1);
  }

  const stocks = loadTrackedStocksFile();
  let withLogo = 0;
  let withoutLogo = 0;

  for (const stock of stocks) {
    const ticker = normalizeTicker(stock.ticker);
    const details = await getPolygonTickerDetails(ticker);
    const servePath = resolveStockLogoServePath(ticker, details);
    if (!servePath) {
      withoutLogo += 1;
      console.log(`[${ticker}] no branding`);
      continue;
    }
    const imageUrl = details?.branding?.icon_url ?? details?.branding?.logo_url;
    const fetchUrl = imageUrl ? appendPolygonApiKey(imageUrl, polygonKey) : null;
    const status = fetchUrl ? (await fetch(fetchUrl)).status : 0;
    withLogo += 1;
    console.log(`[${ticker}] ${servePath} (image HTTP ${status})`);
  }

  console.log(`\n${withLogo} with Polygon logos, ${withoutLogo} without.`);
}

main().catch(console.error);

/**
 * Full stock_data_cache refresh for all tracked tickers (Polygon + Supabase).
 * Run after migration 008+020 exist on the linked project.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { loadTrackedStocksFile, refreshOneStock } from "../src/lib/stock-universe-refresh";

async function main() {
  const stocks = loadTrackedStocksFile();
  console.log(`Refreshing ${stocks.length} tickers locally…`);
  let ok = 0;
  let fail = 0;
  for (const s of stocks) {
    const result = await refreshOneStock(s);
    if (result.ok) {
      ok++;
      console.log(s.ticker, "ok");
    } else {
      fail++;
      console.warn(s.ticker, result.error);
    }
  }
  console.log(`Done. ${ok} ok, ${fail} failed.`);
  process.exit(fail > 0 ? 1 : 0);
}

main();

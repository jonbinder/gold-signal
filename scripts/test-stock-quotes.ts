/**
 * Integration check for Polygon + Yahoo + cache.
 * Run: npm run test:stocks
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getStockQuotes } from "../src/lib/stocks";

const TICKERS = ["NEM", "GOLD", "GDX", "SLV"] as const;

async function main() {
  console.log("Fetching:", TICKERS.join(", "));
  const map = await getStockQuotes([...TICKERS]);
  for (const t of TICKERS) {
    const q = map.get(t);
    if (!q) {
      console.log(`${t}: (no quote)`);
      continue;
    }
    console.log(`${t}: $${q.price.toFixed(4)}  [${q.source}]  asOf=${q.asOf}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

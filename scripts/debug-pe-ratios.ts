import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { loadTrackedStocksSync } from "../src/lib/tracked-stocks-load";
import { normalizeTicker } from "../src/lib/polygon";
import { resolveStockPeRatios } from "../src/lib/stock-pe-ratios";

async function main() {
  const tickers = [...new Set(loadTrackedStocksSync().map((s) => normalizeTicker(s.ticker)))];
  for (const ticker of tickers) {
    const { peRatio, forwardPeRatio } = await resolveStockPeRatios(ticker);
    console.log(
      ticker,
      peRatio != null ? `PE ${peRatio}` : "PE —",
      forwardPeRatio != null ? `Fwd ${forwardPeRatio}` : "Fwd —",
    );
  }
}

main();

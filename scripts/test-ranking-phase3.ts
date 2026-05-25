/**
 * Phase 3 live ranking check — fetches market data and prints SignalScores.
 * Run: npm run test:ranking:live
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { calculatePortfolioScore, rankStockFromMarketData } from "../src/lib/ranking";

const TICKERS = ["NEM", "GOLD", "AEM"] as const;

async function main() {
  if (!process.env.POLYGON_API_KEY?.trim()) {
    console.warn("Warning: POLYGON_API_KEY not set — live ranking will use neutral fallbacks.\n");
  }

  const rankings = [];

  for (const ticker of TICKERS) {
    console.log(`\nRanking ${ticker}…`);
    const result = await rankStockFromMarketData(ticker);
    rankings.push(result);

    console.log(`  SignalScore: ${result.signalScore}`);
    console.log(`  Company: ${result.companyName ?? "n/a"}`);
    for (const [key, sub] of Object.entries(result.subScores)) {
      const flag = sub.missing ? " (neutral)" : "";
      console.log(`    ${key}: ${sub.score}${flag} — ${sub.note}`);
    }
  }

  const portfolio = calculatePortfolioScore(rankings);
  console.log("\n── Portfolio ──");
  console.log(`  Average SignalScore: ${portfolio.averageSignalScore}`);
  console.log(`  Grade: ${portfolio.letterGrade}`);
  console.log(`  Stocks: ${portfolio.stockCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

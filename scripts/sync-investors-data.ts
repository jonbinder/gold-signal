import dotenv from "dotenv";
import path from "path";
import { syncInvestorsToSupabase } from "../src/lib/investors";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const result = await syncInvestorsToSupabase();
  console.log(`Synced investors for ${result.periodLabel}`);
  console.log(`- Investors upserted: ${result.investorsUpserted}`);
  console.log(`- Holdings upserted: ${result.holdingsUpserted}`);
  if (result.skippedTickers.length > 0) {
    console.log(`- Skipped tickers: ${result.skippedTickers.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Sync investors data failed:", err);
  process.exit(1);
});

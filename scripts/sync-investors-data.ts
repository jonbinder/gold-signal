import dotenv from "dotenv";
import path from "path";
import { syncInvestorsToSupabase } from "../src/lib/investors";

// Beginner-friendly command entrypoint:
// Run "npm run sync:investors" after editing investors-data.json.
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const started = Date.now();
  console.log("Starting investors sync...");
  console.log("- Source file: investors-data.json");
  console.log("- Photos directory: public/investors/");

  const result = await syncInvestorsToSupabase();
  console.log(`Synced investors for ${result.periodLabel}`);
  console.log(`- Investors upserted: ${result.investorsUpserted}`);
  console.log(`- Holdings upserted: ${result.holdingsUpserted}`);
  if (result.skippedTickers.length > 0) {
    console.log(`- Skipped tickers (missing in securities table): ${result.skippedTickers.join(", ")}`);
    console.log("  Add those tickers to securities, then run sync again.");
  }
  console.log(`Completed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("Sync investors data failed.");
  console.error(err instanceof Error ? err.message : err);
  console.error('Tip: check investors-data.json format and run "npm run sync:investors" again.');
  process.exit(1);
});

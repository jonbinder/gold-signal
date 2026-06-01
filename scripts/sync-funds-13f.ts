import dotenv from "dotenv";
import path from "path";
import { syncFundsFromEdgar } from "../src/lib/funds/sync";

// Run after adding a CIK to data/funds.json:
//   npm run sync:funds
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const started = Date.now();
  console.log("Starting 13F funds sync from SEC EDGAR...");
  console.log("- Config: data/funds.json");
  console.log("- Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  console.log("- Optional: SEC_EDGAR_USER_AGENT");

  const result = await syncFundsFromEdgar();
  console.log(`Synced ${result.fundsProcessed} fund(s) for period ${result.periodLabel || "(n/a)"}`);
  console.log(`- Holdings upserted: ${result.holdingsUpserted}`);
  console.log(`- 13F rows skipped (no ticker match): ${result.skippedRows}`);
  if (result.errors.length > 0) {
    console.log("- Errors:");
    for (const err of result.errors) console.log(`  · ${err}`);
  }
  console.log(`Completed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("Sync funds 13F failed.");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

/**
 * Manual trigger: sync investor positions from Google Sheet → Supabase.
 * Run: npm run sync:investor-sheet
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { syncInvestorPositionsFromGoogleSheet } from "../src/lib/investor-sheet-sync";
import { createSupabaseServiceClient } from "../src/lib/supabase";
import { revalidateInvestorsRemote } from "./revalidate-investors-remote";

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required");
    process.exit(1);
  }

  const result = await syncInvestorPositionsFromGoogleSheet(supabase);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);

  if (result.touchedSlugs?.length) {
    const revalidated = await revalidateInvestorsRemote(result.touchedSlugs);
    if (!revalidated) {
      console.warn(
        "Cache not busted remotely. Start dev server and re-run, or hit GET /api/sync-investor-sheet on production.",
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

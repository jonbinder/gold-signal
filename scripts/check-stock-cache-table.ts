import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createSupabaseServiceClient } from "../src/lib/supabase";

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const { error } = await supabase.from("stock_data_cache").select("ticker").limit(1);
  if (error) {
    console.log("TABLE_MISSING:", error.message);
    process.exit(2);
  }
  console.log("TABLE_OK");

  const { error: colErr } = await supabase
    .from("stock_data_cache")
    .select("ticker, pe_ratio, forward_pe_ratio")
    .limit(1);
  if (colErr) {
    console.log("COLUMN_ISSUE:", colErr.message);
    process.exit(3);
  }
  console.log("COLUMNS_OK");
}

main();

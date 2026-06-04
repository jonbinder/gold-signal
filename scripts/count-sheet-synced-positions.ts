import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log("missing supabase env");
    process.exit(1);
  }
  const sb = createClient(url, key);

  const { data: colProbe, error: colErr } = await sb
    .from("investor_positions")
    .select("id, google_sheet_synced, source_url")
    .limit(1);

  if (colErr) {
    console.log("COLUMN_CHECK:", colErr.message, colErr.code);
  } else {
    console.log("columns OK (google_sheet_synced, source_url present)");
    console.log("sample:", colProbe?.[0]);
  }

  const { count, error: countErr } = await sb
    .from("investor_positions")
    .select("id", { count: "exact", head: true })
    .eq("google_sheet_synced", true);

  if (countErr?.message?.includes("google_sheet_synced")) {
    console.log("COLUMN_MISSING: run migration 022 (google_sheet_synced, source_url)");
    console.log("error:", countErr.message);
  } else if (countErr) {
    console.log("error:", countErr.message);
  } else {
    console.log("google_sheet_synced positions:", count ?? 0);
  }

  const { count: total } = await sb
    .from("investor_positions")
    .select("id", { count: "exact", head: true });
  console.log("total investor_positions:", total ?? 0);
}

main();

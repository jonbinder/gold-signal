/**
 * Seeds the famous_investors table from data/famous-investors.json.
 * Clears existing rows and re-inserts (safe to re-run after quarterly 13F updates).
 *
 * Run: npm run seed:famous-investors
 */
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseServiceClient } from "../src/lib/supabase";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

type SeedRow = {
  investor_name: string;
  ticker: string;
  position_size_usd?: number | null;
  last_updated?: string;
};

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), "data", "famous-investors.json");
  const raw = await readFile(filePath, "utf8");
  const rows = JSON.parse(raw) as SeedRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("famous-investors.json must be a non-empty array.");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);

  const payload = rows.map((r) => ({
    investor_name: r.investor_name.trim(),
    ticker: r.ticker.trim().toUpperCase(),
    position_size_usd: r.position_size_usd ?? null,
    last_updated: r.last_updated ?? today,
  }));

  console.log(`Clearing famous_investors…`);
  const { error: deleteError } = await supabase.from("famous_investors").delete().not("ticker", "is", null);
  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
    process.exit(1);
  }

  console.log(`Inserting ${payload.length} rows…`);
  const { error: insertError } = await supabase.from("famous_investors").insert(payload);
  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`Done. Seeded ${payload.length} famous investor holdings.`);
  console.log("Edit data/famous-investors.json and re-run this script when new 13Fs are published.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

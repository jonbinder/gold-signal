/**
 * Validate local GS-Investors CSV (replaces Google Sheets sync).
 * Run: npm run sync:investor-sheet
 */
import { getInvestors } from "../src/lib/investors/csv-data";

function main() {
  const rows = getInvestors();
  const bySlug = new Map<string, number>();
  for (const inv of rows) {
    bySlug.set(inv.slug, inv.holdings.length);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        source: "data/GS-Investors.csv",
        rows: rows.length,
        investors: bySlug.size,
        byInvestor: Object.fromEntries(bySlug),
      },
      null,
      2,
    ),
  );
}

main();

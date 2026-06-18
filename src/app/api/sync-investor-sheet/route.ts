import { NextResponse } from "next/server";
import { revalidateInvestorPages } from "@/lib/investor-cache-revalidation";
import { getInvestors } from "@/lib/investors/csv-data";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/sync-investor-sheet — disabled (positions now read from data/GS-Investors.csv).
 * TODO: Restore Google Sheets → Supabase sync if the remote sheet pipeline is re-enabled.
 */
export async function GET() {
  const rows = getInvestors();
  const slugs = [...new Set(rows.map((r) => r.investorSlug))];
  revalidateInvestorPages(slugs);

  return NextResponse.json(
    {
      ok: true,
      disabled: true,
      message: "Google Sheets sync disabled. Positions load from data/GS-Investors.csv.",
      csvRows: rows.length,
      touchedSlugs: slugs,
    },
    { status: 200 },
  );
}

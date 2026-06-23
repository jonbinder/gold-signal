import type { SupabaseClient } from "@supabase/supabase-js";

// TODO: Google Sheets → Supabase sync disabled. Positions load from data/GS-Investors.csv.
// Restore this module from git history if the remote sheet pipeline is re-enabled.

export type InvestorSheetSyncResult = {
  ok: boolean;
  rowsRead: number;
  dataRows: number;
  upserted: number;
  deleted: number;
  investorsCreated: number;
  skipped: Array<{ row: number; reason: string }>;
  touchedSlugs: string[];
  sheetRowTracking?: boolean;
  error?: string;
};

export async function syncInvestorPositionsFromGoogleSheet(
  _supabase: SupabaseClient,
): Promise<InvestorSheetSyncResult> {
  return {
    ok: false,
    rowsRead: 0,
    dataRows: 0,
    upserted: 0,
    deleted: 0,
    investorsCreated: 0,
    skipped: [],
    touchedSlugs: [],
    error: "Google Sheets sync disabled. Use data/GS-Investors.xlsx (see @/lib/investors/csv-data).",
  };
}

import { NextResponse } from "next/server";
import { revalidateInvestorPages } from "@/lib/investor-cache-revalidation";
import { syncInvestorPositionsFromGoogleSheet } from "@/lib/investor-sheet-sync";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { isValidProcessSecret } from "@/lib/trigger-process-one";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  if (isValidProcessSecret(req)) return true;
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/**
 * GET /api/sync-investor-sheet — read Google Sheet → Supabase investor_positions.
 * Auth: x-process-secret (manual) or Authorization: Bearer CRON_SECRET (Vercel cron).
 */
export async function GET(req: Request) {
  const hasSecret =
    Boolean(process.env.PROCESS_SECRET?.trim()) || Boolean(process.env.CRON_SECRET?.trim());
  if (!hasSecret) {
    return NextResponse.json({ error: "Sync not configured (PROCESS_SECRET or CRON_SECRET)" }, { status: 503 });
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role not configured" }, { status: 503 });
  }

  try {
    const result = await syncInvestorPositionsFromGoogleSheet(supabase);
    if (result.ok) {
      revalidateInvestorPages(result.touchedSlugs);
    }
    const status = result.ok ? 200 : result.error?.includes("not configured") ? 503 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[sync-investor-sheet] fatal", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

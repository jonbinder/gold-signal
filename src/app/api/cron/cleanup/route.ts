import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import {
  getDeploymentOrigin,
  invokeProcessOne,
  invokeRefreshStocks,
  invokeSyncInvestorSheet,
} from "@/lib/trigger-process-one";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const STUCK_MS = 30 * 60 * 1000;

/**
 * Daily safety-net cron: re-triggers processing for submissions stuck in pending/processing.
 * Auth: Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    console.error("[cron/cleanup] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - STUCK_MS).toISOString();
  const origin = getDeploymentOrigin(req);

  const { data: pending, error: pendingError } = await supabase
    .from("submissions")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (pendingError) {
    console.error("[cron/cleanup] Pending query failed:", pendingError.message);
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  const { data: processing, error: processingError } = await supabase
    .from("submissions")
    .select("id")
    .eq("status", "processing")
    .or(`processing_started_at.lt.${cutoff},and(processing_started_at.is.null,created_at.lt.${cutoff})`);

  if (processingError) {
    console.error("[cron/cleanup] Processing query failed:", processingError.message);
    return NextResponse.json({ error: processingError.message }, { status: 500 });
  }

  const ids = new Set<string>();
  for (const row of pending ?? []) {
    if (row.id) ids.add(row.id);
  }
  for (const row of processing ?? []) {
    if (row.id) ids.add(row.id);
  }

  const idList = [...ids];
  await Promise.allSettled(idList.map((id) => invokeProcessOne(id, origin)));

  console.info("[cron/cleanup] Invoked process-one for stuck submissions", {
    count: idList.length,
    ids: idList,
  });

  await invokeRefreshStocks(0, origin);
  console.info("[cron/cleanup] Invoked stock universe refresh batch 0");

  await invokeSyncInvestorSheet(origin);
  console.info("[cron/cleanup] Invoked investor sheet sync");

  return NextResponse.json({
    ok: true,
    triggered: ids.size,
    submissionIds: [...ids],
    stockRefreshStarted: true,
    investorSheetSyncStarted: true,
  });
}

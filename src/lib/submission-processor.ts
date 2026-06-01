import { collectReadoutForTickers } from "@/lib/email/readout/collect-ticker-readout";
import { sendReadoutEmail } from "@/lib/email/send-readout-email";
import { sanitizeTickers, parseTickerInput } from "@/lib/portfolio-submission";
import { createSupabaseServiceClient } from "@/lib/supabase";

const STALE_PROCESSING_MS = 15 * 60 * 1000;

export type SubmissionRow = {
  id: string;
  name: string;
  email: string;
  tickers: string[];
  status: string;
};

/**
 * Marks submissions stuck in processing (e.g. after a timeout) as failed so the queue can move on.
 */
export async function resetStaleProcessingSubmissions(): Promise<number> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return 0;

  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
  const { data, error } = await supabase
    .from("submissions")
    .update({
      status: "failed",
      error_message:
        "Processing timed out before completion. Please submit again or contact support@goldsignal.ai.",
    })
    .eq("status", "processing")
    .lt("processing_started_at", cutoff)
    .select("id");

  if (error) {
    console.warn("[processor] Stale processing reset failed:", error.message);
    return 0;
  }

  const count = data?.length ?? 0;
  if (count > 0) {
    console.info("[processor] Reset stale processing submissions", { count });
  }
  return count;
}

/**
 * Loads a submission row by id.
 */
export async function loadSubmissionById(id: string): Promise<SubmissionRow | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("id, name, email, tickers, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load submission: ${error.message}`);
  }

  return data as SubmissionRow | null;
}

/**
 * Atomically claims one pending submission by id.
 */
export async function claimSubmissionById(id: string): Promise<SubmissionRow | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const { data: row, error: claimError } = await supabase
    .from("submissions")
    .update({
      status: "processing",
      error_message: null,
      processing_started_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, name, email, tickers, status")
    .maybeSingle();

  if (claimError) {
    throw new Error(`Failed to claim submission: ${claimError.message}`);
  }

  return row as SubmissionRow | null;
}

/**
 * Runs the full pipeline for one submission id (claim if pending, then process).
 */
export async function processSubmissionById(submissionId: string): Promise<{
  outcome: "completed" | "failed" | "skipped";
  reason?: string;
}> {
  const row = await loadSubmissionById(submissionId);
  if (!row) {
    return { outcome: "skipped", reason: "not_found" };
  }

  if (row.status === "completed") {
    return { outcome: "skipped", reason: "already_completed" };
  }

  if (row.status === "failed") {
    return { outcome: "skipped", reason: "already_failed" };
  }

  let toProcess = row;

  if (row.status === "pending") {
    const claimed = await claimSubmissionById(submissionId);
    if (!claimed) {
      const latest = await loadSubmissionById(submissionId);
      if (latest?.status === "completed") {
        return { outcome: "skipped", reason: "already_completed" };
      }
      if (latest?.status === "processing") {
        toProcess = latest;
      } else {
        return { outcome: "skipped", reason: "claim_lost" };
      }
    } else {
      toProcess = claimed;
    }
  }

  if (toProcess.status !== "processing") {
    return { outcome: "skipped", reason: `unexpected_status_${toProcess.status}` };
  }

  try {
    await processSubmission(toProcess);
    return { outcome: "completed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown processing error";
    return { outcome: "failed", reason: message };
  }
}

/**
 * Atomically claims pending submissions by updating status only when still pending.
 */
export async function claimPendingSubmissions(limit: number): Promise<SubmissionRow[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const claimed: SubmissionRow[] = [];

  for (let i = 0; i < limit; i++) {
    const { data: next, error: fetchError } = await supabase
      .from("submissions")
      .select("id")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError || !next?.id) break;

    const { data: row, error: claimError } = await supabase
      .from("submissions")
      .update({
        status: "processing",
        error_message: null,
        processing_started_at: new Date().toISOString(),
      })
      .eq("id", next.id)
      .eq("status", "pending")
      .select("id, name, email, tickers, status")
      .maybeSingle();

    if (claimError || !row) continue;
    claimed.push(row as SubmissionRow);
  }

  return claimed;
}

/**
 * Processes one submission: build per-ticker readout from stored data, send via Resend.
 */
export async function processSubmission(submission: SubmissionRow): Promise<void> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const submissionId = submission.id;
  const tickers = sanitizeTickers(
    submission.tickers.flatMap((t) =>
      typeof t === "string" ? (t.includes(",") ? parseTickerInput(t) : [t]) : [],
    ),
  );

  if (tickers.length === 0) {
    throw new Error("No valid tickers to process.");
  }

  console.info("[processor] Loaded submission", {
    submissionId,
    tickers,
    email: submission.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
  });

  try {
    const { readouts } = await collectReadoutForTickers(tickers);

    console.info("[processor] Sending readout email", { submissionId, count: readouts.length });
    const { emailId } = await sendReadoutEmail({
      to: submission.email,
      userName: submission.name,
      tickers: readouts,
      skippedInvalidTickers: [],
    });

    const sentAt = new Date().toISOString();
    const { error: completeError } = await supabase
      .from("submissions")
      .update({
        status: "completed",
        completed_at: sentAt,
        readout_sent_at: sentAt,
        readout_email_id: emailId,
        error_message: null,
        portfolio_score: null,
        portfolio_grade: null,
        pdf_url: null,
      })
      .eq("id", submissionId);

    if (completeError) {
      throw new Error(`Failed to mark completed: ${completeError.message}`);
    }

    const { error: watchlistLinkError } = await supabase
      .from("watchlist_signups")
      .update({ readout_sent_at: sentAt, readout_submission_id: submissionId })
      .eq("email", submission.email)
      .is("readout_sent_at", null);

    if (watchlistLinkError) {
      console.warn("[processor] watchlist_signups link skipped", watchlistLinkError.message);
    }

    console.info("[processor] Readout sent via Resend", { submissionId, emailId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown processing error";
    console.error("[processor] Failed", { submissionId, message });
    await supabase
      .from("submissions")
      .update({ status: "failed", error_message: message })
      .eq("id", submissionId);
    throw err;
  }
}

/**
 * Resets stale jobs, claims pending rows atomically, and processes each sequentially.
 */
export async function processPendingSubmissions(limit = 1): Promise<{
  processed: number;
  failed: number;
  ids: string[];
  staleReset: number;
}> {
  const staleReset = await resetStaleProcessingSubmissions();
  const rows = await claimPendingSubmissions(limit);

  let processed = 0;
  let failed = 0;
  const ids: string[] = rows.map((r) => r.id);

  for (const row of rows) {
    try {
      await processSubmission(row);
      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, failed, ids, staleReset };
}

import { sendReportEmail } from "@/lib/email/send-report-email";
import { generateSignalScorePdf } from "@/lib/pdf/generate-report";
import { topPickAndWatchOut } from "@/lib/pdf/report-copy";
import {
  calculatePortfolioScore,
  rankStockFromMarketData,
  type StockRankingResult,
  type SubScoreKey,
} from "@/lib/ranking";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { uploadReportPdf } from "@/lib/storage/reports";

const SUB_SCORE_DB_MAP: Record<SubScoreKey, keyof StockRankingRowInsert> = {
  institutional: "institutional_score",
  insider: "insider_score",
  pe: "pe_score",
  famousInvestor: "famous_investor_score",
  support: "support_score",
  correlation: "correlation_score",
  fcfYield: "fcf_yield_score",
};

const STALE_PROCESSING_MS = 15 * 60 * 1000;

type StockRankingRowInsert = {
  submission_id: string;
  ticker: string;
  company_name: string | null;
  signal_score: number;
  institutional_score: number | null;
  insider_score: number | null;
  pe_score: number | null;
  famous_investor_score: number | null;
  support_score: number | null;
  correlation_score: number | null;
  fcf_yield_score: number | null;
  raw_metrics: Record<string, unknown>;
};

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
  } catch {
    return { outcome: "failed" };
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
 * Processes one submission already in processing state: rank stocks, PDF, email.
 */
export async function processSubmission(submission: SubmissionRow): Promise<void> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const submissionId = submission.id;
  console.info("[processor] Starting", { submissionId, tickers: submission.tickers });

  try {
    await supabase.from("stock_rankings").delete().eq("submission_id", submissionId);

    const rankings: StockRankingResult[] = [];

    for (const rawTicker of submission.tickers) {
      console.info("[processor] Ranking ticker", { submissionId, ticker: rawTicker });
      const ranking = await rankStockFromMarketData(rawTicker);
      rankings.push(ranking);

      const row: StockRankingRowInsert = {
        submission_id: submissionId,
        ticker: ranking.ticker,
        company_name: ranking.companyName,
        signal_score: ranking.signalScore,
        institutional_score: null,
        insider_score: null,
        pe_score: null,
        famous_investor_score: null,
        support_score: null,
        correlation_score: null,
        fcf_yield_score: null,
        raw_metrics: ranking.rawMetrics,
      };

      for (const [key, col] of Object.entries(SUB_SCORE_DB_MAP) as [
        SubScoreKey,
        keyof StockRankingRowInsert,
      ][]) {
        const sub = ranking.subScores[key];
        (row as Record<string, unknown>)[col] = sub.missing ? null : sub.score;
      }

      const { error: insertError } = await supabase.from("stock_rankings").insert(row);
      if (insertError) {
        throw new Error(`stock_rankings insert failed for ${ranking.ticker}: ${insertError.message}`);
      }
    }

    const portfolio = calculatePortfolioScore(rankings);
    console.info("[processor] Portfolio scored", {
      submissionId,
      score: portfolio.averageSignalScore,
      grade: portfolio.letterGrade,
    });

    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.info("[processor] Generating PDF", { submissionId });
    const pdfBuffer = await generateSignalScorePdf({
      userName: submission.name,
      reportDate,
      portfolioScore: portfolio.averageSignalScore,
      portfolioGrade: portfolio.letterGrade,
      rankings,
    });

    console.info("[processor] Uploading PDF", { submissionId });
    const { signedUrl } = await uploadReportPdf(submissionId, pdfBuffer);

    console.info("[processor] Sending email", { submissionId });
    const { emailId } = await sendReportEmail({
      to: submission.email,
      userName: submission.name,
      portfolioGrade: portfolio.letterGrade,
      portfolioScore: portfolio.averageSignalScore,
      rankings,
      pdfBuffer,
      downloadUrl: signedUrl,
    });

    const { error: completeError } = await supabase
      .from("submissions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: null,
        portfolio_score: portfolio.averageSignalScore,
        portfolio_grade: portfolio.letterGrade,
        pdf_url: signedUrl,
      })
      .eq("id", submissionId);

    if (completeError) {
      throw new Error(`Failed to mark completed: ${completeError.message}`);
    }

    const picks = topPickAndWatchOut(rankings);
    console.info("[processor] Completed", {
      submissionId,
      emailId,
      top: picks.top?.ticker,
      bottom: picks.bottom?.ticker,
    });
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

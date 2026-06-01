import { NextResponse } from "next/server";
import { getDeploymentOrigin, triggerProcessOne } from "@/lib/trigger-process-one";
import {
  MAX_PORTFOLIO_TICKERS,
  parseTickerInput,
  sanitizeTickers,
} from "@/lib/portfolio-submission";
import { getSubmissionSupabaseClient } from "@/lib/submission-supabase";
import { validateWatchlistPayload } from "@/lib/watchlist-signup";

/**
 * POST /api/watchlist — homepage capture: save list + queue filing readout email.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateWatchlistPayload(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error, field: validated.field },
      { status: 400 },
    );
  }

  const resolved = getSubmissionSupabaseClient();
  if (!resolved) {
    return NextResponse.json(
      { error: "Signup service is not configured. Please try again later." },
      { status: 503 },
    );
  }

  const { client: supabase } = resolved;
  const { name, email, stocksWatching } = validated.data;
  const tickers = sanitizeTickers(parseTickerInput(stocksWatching));

  if (tickers.length === 0) {
    return NextResponse.json(
      {
        error:
          "Enter at least one valid ticker (letters and dots only, e.g. NEM, WPM, or BRK.A).",
        field: "stocksWatching",
      },
      { status: 400 },
    );
  }

  if (tickers.length > MAX_PORTFOLIO_TICKERS) {
    return NextResponse.json(
      {
        error: `You can submit at most ${MAX_PORTFOLIO_TICKERS} tickers.`,
        field: "stocksWatching",
      },
      { status: 400 },
    );
  }

  const { data: signup, error: signupError } = await supabase
    .from("watchlist_signups")
    .insert({
      name,
      email,
      stocks_watching: stocksWatching,
    })
    .select("id")
    .single();

  if (signupError) {
    console.error("[watchlist] Insert failed:", signupError.message);
    return NextResponse.json(
      { error: "Could not save your signup. Please try again later." },
      { status: 500 },
    );
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      name,
      email,
      tickers,
      status: "pending",
    })
    .select("id")
    .single();

  if (submissionError || !submission?.id) {
    console.error("[watchlist] Submission insert failed:", submissionError?.message);
    return NextResponse.json(
      { error: "Could not queue your readout. Please try again later." },
      { status: 500 },
    );
  }

  await supabase
    .from("watchlist_signups")
    .update({ readout_submission_id: submission.id })
    .eq("id", signup.id);

  try {
    triggerProcessOne(submission.id, getDeploymentOrigin(req));
  } catch (err) {
    console.warn("[watchlist] Failed to trigger process-one", {
      submissionId: submission.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json(
    {
      success: true,
      id: submission.id,
      message: `Thanks, ${name}! Your filing readout is on its way to ${email} — usually within a few minutes.`,
    },
    { status: 201 },
  );
}

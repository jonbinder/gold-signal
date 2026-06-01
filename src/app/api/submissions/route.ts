import { NextResponse } from "next/server";
import { validateSubmissionPayload } from "@/lib/portfolio-submission";
import { checkSubmissionRateLimit } from "@/lib/submission-rate-limit";
import {
  logSubmissionEnvConfigOnLoad,
  logSubmissionServiceConfigFailure,
} from "@/lib/submission-env";
import { getSubmissionSupabaseClient } from "@/lib/submission-supabase";
import { getDeploymentOrigin, triggerProcessOne } from "@/lib/trigger-process-one";

logSubmissionEnvConfigOnLoad("submissions");

/**
 * POST /api/submissions — create a pending portfolio review submission.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateSubmissionPayload(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error.message, field: validated.error.field },
      { status: 400 }
    );
  }

  const resolved = getSubmissionSupabaseClient();
  if (!resolved) {
    logSubmissionServiceConfigFailure("submissions");
    return NextResponse.json(
      { error: "Submission service is not configured. Please try again later." },
      { status: 503 }
    );
  }

  const { client: supabase, mode } = resolved;
  const { name, email, tickers } = validated.data;

  const rateLimit = await checkSubmissionRateLimit(email, resolved);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.message, field: "email" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      name,
      email,
      tickers,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submissions] Insert failed:", error.message, error.code, { mode });
    const hint =
      mode === "anon" && error.code === "42501"
        ? " Run migration 009_submissions_anon_insert.sql in Supabase."
        : "";
    return NextResponse.json(
      {
        error: `Could not save your submission. Please try again.${hint}`,
      },
      { status: 500 }
    );
  }

  console.info("[submissions] Insert ok", { submissionId: data.id, mode });

  try {
    triggerProcessOne(data.id, getDeploymentOrigin(req));
  } catch (err) {
    console.warn("[submissions] Failed to trigger process-one", {
      submissionId: data.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json(
    {
      success: true,
      id: data.id,
      message: `Thanks, ${name}! Your filing readout is on its way to ${email} — usually within a few minutes.`,
    },
    { status: 201 }
  );
}

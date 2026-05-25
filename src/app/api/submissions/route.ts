import { NextResponse } from "next/server";
import { validateSubmissionPayload } from "@/lib/portfolio-submission";
import { checkSubmissionRateLimit } from "@/lib/submission-rate-limit";
import {
  logSubmissionEnvConfigOnLoad,
  logSubmissionServiceConfigFailure,
} from "@/lib/submission-env";
import { createSupabaseServiceClient } from "@/lib/supabase";
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

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    logSubmissionServiceConfigFailure("submissions");
    return NextResponse.json(
      { error: "Submission service is not configured. Please try again later." },
      { status: 503 }
    );
  }

  const { name, email, tickers } = validated.data;

  const rateLimit = await checkSubmissionRateLimit(email);
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
    console.error("[submissions] Insert failed:", error.message, error.code);
    return NextResponse.json(
      { error: "Could not save your submission. Please try again." },
      { status: 500 }
    );
  }

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
      message: `Thanks, ${name}! Your SignalScore report is being generated and will arrive at ${email} within the next few minutes.`,
    },
    { status: 201 }
  );
}

import { NextResponse } from "next/server";
import { processSubmissionById } from "@/lib/submission-processor";
import { isValidProcessSecret } from "@/lib/trigger-process-one";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/process-one?submissionId= — process a single submission (internal, fire-and-forget target).
 * Auth: x-process-secret header must match PROCESS_SECRET.
 */
export async function GET(req: Request) {
  if (!process.env.PROCESS_SECRET?.trim()) {
    console.error("[process-one] PROCESS_SECRET is not configured");
    return NextResponse.json({ error: "Processor not configured" }, { status: 503 });
  }

  if (!isValidProcessSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissionId = new URL(req.url).searchParams.get("submissionId")?.trim();
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  try {
    console.info("[process-one] Started", { submissionId });
    const result = await processSubmissionById(submissionId);
    console.info("[process-one] Finished", { submissionId, ...result });

    if (result.outcome === "failed") {
      return NextResponse.json(
        { ok: false, submissionId, ...result },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, submissionId, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error("[process-one] Error", { submissionId, message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

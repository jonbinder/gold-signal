import { NextResponse } from "next/server";
import { processPendingSubmissions } from "@/lib/submission-processor";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Vercel cron: processes one pending portfolio review submission per invocation.
 * Auth: Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.info("[cron] process-submissions started");
    const result = await processPendingSubmissions(1);
    console.info("[cron] process-submissions finished", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron failed";
    console.error("[cron] process-submissions error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

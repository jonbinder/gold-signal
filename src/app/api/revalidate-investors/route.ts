import { NextResponse } from "next/server";
import { revalidateInvestorPages } from "@/lib/investor-cache-revalidation";
import { isValidProcessSecret } from "@/lib/trigger-process-one";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  if (isValidProcessSecret(req)) return true;
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/**
 * POST /api/revalidate-investors — bust investors list/detail cache without re-syncing the sheet.
 * Body: { "slugs": ["adrian-day", ...] } (optional).
 * Auth: x-process-secret or Authorization: Bearer CRON_SECRET.
 */
export async function POST(req: Request) {
  if (!process.env.PROCESS_SECRET?.trim() && !process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: "Revalidate not configured" }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let slugs: string[] = [];
  try {
    const body = (await req.json()) as { slugs?: unknown };
    if (Array.isArray(body.slugs)) {
      slugs = body.slugs.filter((s): s is string => typeof s === "string");
    }
  } catch {
    /* empty body is fine */
  }

  revalidateInvestorPages(slugs);
  return NextResponse.json({ ok: true, slugs });
}

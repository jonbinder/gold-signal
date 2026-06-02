import { NextRequest, NextResponse } from "next/server";
import { getPublishedInvestorsDebug } from "@/lib/investors/queries";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const supplied =
    request.nextUrl.searchParams.get("key")?.trim() ??
    request.headers.get("x-debug-key")?.trim() ??
    "";
  const processSecret = process.env.PROCESS_SECRET?.trim() ?? "";
  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  return Boolean(supplied && (supplied === processSecret || supplied === cronSecret));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const debug = await getPublishedInvestorsDebug("name");
    return NextResponse.json({
      ok: true,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: process.env.VERCEL_ENV ?? null,
      debug,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

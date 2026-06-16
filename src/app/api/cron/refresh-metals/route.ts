import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { refreshMetalsMarketCache } from "@/lib/metals-market-refresh";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Hourly metals cache refresh (spot gold/silver → metals_market_cache).
 * Auth: Authorization: Bearer {CRON_SECRET}
 * On API failure, leaves the last good row in Supabase untouched.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    console.error("[cron/refresh-metals] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshMetalsMarketCache();
  if (result.ok) {
    revalidateTag("metals-market");
    revalidatePath("/");
    console.info("[cron/refresh-metals] cache updated");
  } else {
    console.warn("[cron/refresh-metals] refresh failed (serving last cache)", result.error);
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

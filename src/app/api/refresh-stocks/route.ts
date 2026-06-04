import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { refreshMetalsMarketCache } from "@/lib/metals-market-refresh";
import { processRefreshBatch } from "@/lib/stock-universe-refresh";
import { getDeploymentOrigin, isValidProcessSecret, triggerRefreshStocks } from "@/lib/trigger-process-one";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/refresh-stocks?batch=N — refresh up to 25 stale tickers, chain to next batch.
 * Auth: x-process-secret header must match PROCESS_SECRET.
 */
export async function GET(req: Request) {
  if (!process.env.PROCESS_SECRET?.trim()) {
    console.error("[refresh-stocks] PROCESS_SECRET is not configured");
    return NextResponse.json({ error: "Refresh not configured" }, { status: 503 });
  }

  if (!isValidProcessSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchParam = new URL(req.url).searchParams.get("batch");
  const batch = batchParam != null ? Math.max(0, parseInt(batchParam, 10) || 0) : 0;

  try {
    console.info("[refresh-stocks] Starting batch", { batch });
    const result = await processRefreshBatch(batch);

    if (!result.done) {
      const origin = getDeploymentOrigin(req);
      triggerRefreshStocks(batch + 1, origin);
      console.info("[refresh-stocks] Chaining to next batch", { nextBatch: batch + 1 });
    } else {
      console.info("[refresh-stocks] All batches complete");
      const metals = await refreshMetalsMarketCache();
      if (!metals.ok) {
        console.warn("[refresh-stocks] metals_market_cache refresh failed", metals.error);
      }
      revalidateTag("stocks-list");
      revalidateTag("metals-market");
      revalidatePath("/stocks");
      revalidatePath("/");
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh batch failed";
    console.error("[refresh-stocks] Batch error", { batch, message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

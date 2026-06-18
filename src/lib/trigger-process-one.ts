import { after } from "next/server";

/**
 * Fire-and-forget trigger for /api/process-one (uses Next.js `after` + waitUntil on Vercel).
 */
export function getDeploymentOrigin(req?: Request): string {
  if (req) {
    return new URL(req.url).origin;
  }
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function isValidProcessSecret(request: Request): boolean {
  const expected = process.env.PROCESS_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("x-process-secret") === expected;
}

/**
 * Calls /api/process-one and logs the result. Await this in cron; use triggerProcessOne in routes.
 */
export async function invokeProcessOne(submissionId: string, origin: string): Promise<void> {
  const secret = process.env.PROCESS_SECRET?.trim();
  if (!secret) {
    console.warn("[trigger] PROCESS_SECRET not set; skipping process-one", { submissionId });
    return;
  }

  const url = new URL("/api/process-one", origin);
  url.searchParams.set("submissionId", submissionId);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "x-process-secret": secret },
    });
    const body = await res.text().catch(() => "");
    let parsed: { outcome?: string; reason?: string } | null = null;
    try {
      parsed = JSON.parse(body) as { outcome?: string; reason?: string };
    } catch {
      parsed = null;
    }

    const pipelineFailed = parsed?.outcome === "failed";
    if (!res.ok || pipelineFailed) {
      console.warn("[trigger] process-one returned error", {
        submissionId,
        status: res.status,
        outcome: parsed?.outcome,
        reason: parsed?.reason,
        body: body.slice(0, 500),
        url: url.origin + url.pathname,
      });
      return;
    }
    console.info("[trigger] process-one ok", {
      submissionId,
      status: res.status,
      body: body.slice(0, 200),
    });
  } catch (err) {
    console.warn("[trigger] process-one fetch failed", {
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Schedules process-one after the HTTP response (reliable on Vercel serverless).
 */
export function triggerProcessOne(submissionId: string, origin: string): void {
  after(async () => {
    await invokeProcessOne(submissionId, origin);
  });
}

/**
 * Awaitable trigger for cron / batch recovery (do not use bare fetch without await).
 */
export async function invokeRefreshStocks(batch: number, origin: string): Promise<void> {
  const secret = process.env.PROCESS_SECRET?.trim();
  if (!secret) {
    console.warn("[trigger] PROCESS_SECRET not set; skipping refresh-stocks", { batch });
    return;
  }

  const url = new URL("/api/refresh-stocks", origin);
  url.searchParams.set("batch", String(batch));

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "x-process-secret": secret },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[trigger] refresh-stocks returned error", {
        batch,
        status: res.status,
        body: body.slice(0, 300),
      });
      return;
    }
    console.info("[trigger] refresh-stocks ok", { batch, status: res.status });
  } catch (err) {
    console.warn("[trigger] refresh-stocks fetch failed", {
      batch,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export function triggerRefreshStocks(batch: number, origin: string): void {
  after(async () => {
    await invokeRefreshStocks(batch, origin);
  });
}

/** Cron hook: refresh metals_market_cache (uses CRON_SECRET bearer). */
export async function invokeRefreshMetals(origin: string): Promise<void> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    console.warn("[trigger] CRON_SECRET not set; skipping refresh-metals");
    return;
  }

  const url = new URL("/api/cron/refresh-metals", origin);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { authorization: `Bearer ${cronSecret}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[trigger] refresh-metals returned error", {
        status: res.status,
        body: body.slice(0, 300),
      });
      return;
    }
    console.info("[trigger] refresh-metals ok", { status: res.status });
  } catch (err) {
    console.warn("[trigger] refresh-metals fetch failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/** TODO: Google Sheets sync disabled — portfolio positions read from data/GS-Investors.csv. */
export async function invokeSyncInvestorSheet(_origin: string): Promise<void> {
  console.info("[trigger] sync-investor-sheet skipped (CSV is source of truth for positions)");
}

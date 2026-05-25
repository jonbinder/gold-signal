/**
 * Fire-and-forget trigger for /api/process-one (Hobby: no await; errors are logged only).
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

export function triggerProcessOne(submissionId: string, origin: string): void {
  const secret = process.env.PROCESS_SECRET?.trim();
  if (!secret) {
    console.warn("[trigger] PROCESS_SECRET not set; skipping process-one", { submissionId });
    return;
  }

  try {
    const url = new URL("/api/process-one", origin);
    url.searchParams.set("submissionId", submissionId);

    fetch(url.toString(), {
      method: "GET",
      headers: { "x-process-secret": secret },
    }).catch((err) => {
      console.warn("[trigger] process-one fetch failed", {
        submissionId,
        message: err instanceof Error ? err.message : String(err),
      });
    });
  } catch (err) {
    console.warn("[trigger] process-one setup failed", {
      submissionId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export function isValidProcessSecret(request: Request): boolean {
  const expected = process.env.PROCESS_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("x-process-secret") === expected;
}

/**
 * Fire-and-forget trigger for /api/refresh-stocks batch chain.
 */
export function triggerRefreshStocks(batch: number, origin: string): void {
  const secret = process.env.PROCESS_SECRET?.trim();
  if (!secret) {
    console.warn("[trigger] PROCESS_SECRET not set; skipping refresh-stocks", { batch });
    return;
  }

  try {
    const url = new URL("/api/refresh-stocks", origin);
    url.searchParams.set("batch", String(batch));

    fetch(url.toString(), {
      method: "GET",
      headers: { "x-process-secret": secret },
    }).catch((err) => {
      console.warn("[trigger] refresh-stocks fetch failed", {
        batch,
        message: err instanceof Error ? err.message : String(err),
      });
    });
  } catch (err) {
    console.warn("[trigger] refresh-stocks setup failed", {
      batch,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

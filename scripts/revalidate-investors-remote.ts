/**
 * Call a running Next app to bust investors ISR/cache (after CLI sheet sync).
 */
export async function revalidateInvestorsRemote(slugs: string[]): Promise<boolean> {
  const secret = process.env.PROCESS_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn("[revalidate] PROCESS_SECRET or CRON_SECRET not set — skip remote cache bust");
    return false;
  }

  const origins = [
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : undefined,
    "http://localhost:3000",
  ].filter((o): o is string => Boolean(o));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-process-secret": secret,
  };

  for (const origin of origins) {
    try {
      const res = await fetch(`${origin}/api/revalidate-investors`, {
        method: "POST",
        headers,
        body: JSON.stringify({ slugs }),
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        console.log(`[revalidate] OK via ${origin}`);
        return true;
      }
      console.warn(`[revalidate] ${origin} → ${res.status}`);
    } catch (err) {
      console.warn(`[revalidate] ${origin} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return false;
}

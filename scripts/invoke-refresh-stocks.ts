/**
 * Trigger production /api/refresh-stocks batches until done.
 * Requires PROCESS_SECRET in .env.local
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://goldsignal.ai").replace(/\/$/, "");

async function runBatch(batch: number): Promise<{ done: boolean; body: string }> {
  const secret = process.env.PROCESS_SECRET?.trim();
  if (!secret) throw new Error("PROCESS_SECRET missing from .env.local");

  const url = new URL("/api/refresh-stocks", ORIGIN);
  url.searchParams.set("batch", String(batch));

  const res = await fetch(url.toString(), {
    headers: { "x-process-secret": secret },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`);
  const json = JSON.parse(body) as { done?: boolean };
  return { done: !!json.done, body };
}

async function main() {
  console.log("Origin:", ORIGIN);
  for (let batch = 0; batch < 20; batch++) {
    const { done, body } = await runBatch(batch);
    console.log(`batch ${batch}:`, body.slice(0, 200));
    if (done) {
      console.log("All batches complete.");
      return;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.warn("Stopped after 20 batches without done=true");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

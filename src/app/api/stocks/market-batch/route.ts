import { NextResponse } from "next/server";
import { getStockMarketSnapshots } from "@/lib/stocks";

const MAX = 400;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const tickers = body && typeof body === "object" ? (body as { tickers?: unknown }).tickers : null;
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return NextResponse.json({ error: "tickers must be a non-empty array" }, { status: 400 });
  }
  if (tickers.length > MAX) {
    return NextResponse.json({ error: `At most ${MAX} tickers` }, { status: 400 });
  }
  const cleaned = tickers.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  const map = await getStockMarketSnapshots(cleaned, 14);
  const quotes: Record<string, unknown> = {};
  for (const [k, v] of map.entries()) {
    quotes[k] = v;
  }
  return NextResponse.json({ quotes, asOf: new Date().toISOString() });
}

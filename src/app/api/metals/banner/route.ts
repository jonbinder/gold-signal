import { NextResponse } from "next/server";
import { getStockMarketSnapshot, getStockMarketSnapshots } from "@/lib/stocks";
import type { StockMarketSnapshot } from "@/lib/stocks";
import type { MarketBannerPayload, MarketBannerQuote } from "@/types/metals-banner";

/** Real spot/index instruments + miner ETF. */
const TICKERS = {
  gold: "XAUUSD",
  silver: "XAGUSD",
  sp500: "I:SPX",
  gdx: "GDX",
} as const;

const FALLBACKS = {
  gold: ["GC=F"],
  silver: ["SI=F"],
} as const;

function toQuote(
  snap: { price: number | null; changePct: number | null } | null | undefined,
): MarketBannerQuote | null {
  if (!snap?.price || !Number.isFinite(snap.price) || snap.price <= 0) return null;
  return { price: snap.price, changePct: snap.changePct };
}

async function resolveWithFallback(
  primary: string,
  extraFallbacks: readonly string[],
  primaryMap: Map<string, StockMarketSnapshot | null>,
): Promise<{ quote: MarketBannerQuote | null; asOf: string | null }> {
  const primarySnap = primaryMap.get(primary);
  const primaryQuote = toQuote(primarySnap);
  if (primaryQuote) return { quote: primaryQuote, asOf: primarySnap?.asOf ?? null };

  for (const ticker of extraFallbacks) {
    const snap = await getStockMarketSnapshot(ticker);
    const quote = toQuote(snap);
    if (quote) return { quote, asOf: snap?.asOf ?? null };
  }

  return { quote: null, asOf: primarySnap?.asOf ?? null };
}

export async function GET() {
  const map = await getStockMarketSnapshots([
    TICKERS.gold,
    TICKERS.silver,
    TICKERS.sp500,
    TICKERS.gdx,
  ]);

  const goldResolved = await resolveWithFallback(TICKERS.gold, FALLBACKS.gold, map);
  const silverResolved = await resolveWithFallback(TICKERS.silver, FALLBACKS.silver, map);
  const gold = goldResolved.quote;
  const silver = silverResolved.quote;
  const sp500 = toQuote(map.get(TICKERS.sp500) ?? null);
  const gdx = toQuote(map.get(TICKERS.gdx) ?? null);

  const asOf =
    goldResolved.asOf ??
    silverResolved.asOf ??
    map.get(TICKERS.sp500)?.asOf ??
    map.get(TICKERS.gdx)?.asOf ??
    new Date().toISOString();

  const body: MarketBannerPayload = { gold, silver, sp500, gdx, asOf };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

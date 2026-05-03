import { NextResponse } from "next/server";
import { getStockMarketSnapshots } from "@/lib/stocks";
import type { MarketBannerPayload, MarketBannerQuote } from "@/types/metals-banner";

/** ETF proxies (Polygon stocks snapshot); more reliable than spot forex for many keys/tiers. */
const TICKERS = {
  gold: "GLD",
  silver: "SLV",
  sp500: "SPY",
  gdx: "GDX",
} as const;

function toQuote(
  snap: { price: number | null; changePct: number | null } | null | undefined,
): MarketBannerQuote | null {
  if (!snap?.price || !Number.isFinite(snap.price) || snap.price <= 0) return null;
  return { price: snap.price, changePct: snap.changePct };
}

export async function GET() {
  const map = await getStockMarketSnapshots([
    TICKERS.gold,
    TICKERS.silver,
    TICKERS.sp500,
    TICKERS.gdx,
  ]);

  const gold = toQuote(map.get(TICKERS.gold) ?? null);
  const silver = toQuote(map.get(TICKERS.silver) ?? null);
  const sp500 = toQuote(map.get(TICKERS.sp500) ?? null);
  const gdx = toQuote(map.get(TICKERS.gdx) ?? null);

  const asOf =
    map.get(TICKERS.gold)?.asOf ??
    map.get(TICKERS.silver)?.asOf ??
    map.get(TICKERS.sp500)?.asOf ??
    map.get(TICKERS.gdx)?.asOf ??
    new Date().toISOString();

  const body: MarketBannerPayload = { gold, silver, sp500, gdx, asOf };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

import { NextResponse } from "next/server";
import { getStockMarketSnapshot } from "@/lib/stocks";
import type { MetalsBannerPayload } from "@/types/metals-banner";

const GOLD = "C:XAUUSD";
const SILVER = "C:XAGUSD";

export async function GET() {
  const [goldSnap, silverSnap] = await Promise.all([
    getStockMarketSnapshot(GOLD),
    getStockMarketSnapshot(SILVER),
  ]);

  const gold =
    goldSnap?.price != null && Number.isFinite(goldSnap.price) && goldSnap.price > 0
      ? { price: goldSnap.price, changePct: goldSnap.changePct }
      : null;
  const silver =
    silverSnap?.price != null && Number.isFinite(silverSnap.price) && silverSnap.price > 0
      ? { price: silverSnap.price, changePct: silverSnap.changePct }
      : null;

  let ratio: number | null = null;
  if (gold && silver && silver.price > 0) {
    ratio = Math.round(gold.price / silver.price);
  }

  const asOf = goldSnap?.asOf ?? silverSnap?.asOf ?? new Date().toISOString();

  const body: MetalsBannerPayload = { gold, silver, ratio, asOf };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

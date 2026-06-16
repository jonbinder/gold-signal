import { NextResponse } from "next/server";
import { getSpotSnapshot, SPOT_REVALIDATE_SECONDS } from "@/lib/spot-market";

/** 10-minute stale-while-revalidate for spot quotes. */
export const revalidate = 600;

/**
 * GET /api/spot — cached gold/silver spot + ratio (Polygon/Yahoo via existing helpers).
 * Independent of stock_data_cache and the daily filing cron.
 */
export async function GET() {
  const snapshot = await getSpotSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": `public, s-maxage=${SPOT_REVALIDATE_SECONDS}, stale-while-revalidate=${SPOT_REVALIDATE_SECONDS}`,
    },
  });
}

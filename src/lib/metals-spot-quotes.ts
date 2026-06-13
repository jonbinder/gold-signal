import { getStockMarketSnapshot } from "@/lib/stocks";

/** COMEX / forex spot proxies — never GLD or SLV (ETF share prices). */
const GOLD_TICKERS = ["XAUUSD", "GC=F"] as const;
const SILVER_TICKERS = ["XAGUSD", "SI=F"] as const;

export type MetalSpotQuote = {
  price: number;
  changePct: number | null;
  sourceTicker: string;
};

/** Reject ETF-scale prices mistaken for spot (e.g. GLD ~$407, SLV ~$60). */
function isPlausibleSpotPrice(ticker: string, price: number): boolean {
  const sym = ticker.toUpperCase();
  if (sym === "GLD" || sym === "SLV" || sym === "GLDM" || sym === "IAU") return false;
  if (sym.includes("GLD")) return false;
  if (sym.includes("SLV") && !sym.includes("XAG")) return false;
  if (sym === "GC=F" || sym === "C:XAUUSD" || sym.startsWith("XAU")) return price >= 800;
  if (sym === "SI=F" || sym === "C:XAGUSD" || sym.startsWith("XAG")) return price >= 12 && price <= 250;
  return price >= 12;
}

export async function resolveGoldSpotQuote(): Promise<MetalSpotQuote | null> {
  return resolveMetalSpotQuote(GOLD_TICKERS);
}

export async function resolveSilverSpotQuote(): Promise<MetalSpotQuote | null> {
  return resolveMetalSpotQuote(SILVER_TICKERS);
}

async function resolveMetalSpotQuote(tickers: readonly string[]): Promise<MetalSpotQuote | null> {
  for (const ticker of tickers) {
    const snap = await getStockMarketSnapshot(ticker);
    if (snap?.price == null || !Number.isFinite(snap.price) || snap.price <= 0) continue;
    if (!isPlausibleSpotPrice(snap.ticker, snap.price)) continue;
    return {
      price: snap.price,
      changePct: snap.changePct,
      sourceTicker: snap.ticker,
    };
  }
  return null;
}

export function goldSilverRatioChangePct(gold: MetalSpotQuote, silver: MetalSpotQuote): number | null {
  const gChg = gold.changePct;
  const sChg = silver.changePct;
  if (gChg == null || sChg == null || !Number.isFinite(gChg) || !Number.isFinite(sChg)) {
    return null;
  }
  const goldPrev = gold.price / (1 + gChg / 100);
  const silverPrev = silver.price / (1 + sChg / 100);
  if (goldPrev <= 0 || silverPrev <= 0) return null;
  const ratioNow = gold.price / silver.price;
  const ratioPrev = goldPrev / silverPrev;
  if (ratioPrev <= 0) return null;
  return ((ratioNow - ratioPrev) / ratioPrev) * 100;
}

import type { FinancialsBundle, QuarterlyFinancials } from "@/lib/polygon";
import { getFinancials, getStockPrice, getTickerDetails } from "@/lib/polygon";
import { fetchYahooPeMetrics } from "@/lib/stock-profile";

export type StockPeRatios = {
  peRatio: number | null;
  forwardPeRatio: number | null;
};

export function roundPeRatio(value: number | null): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? rounded : null;
}

export function computePeRatiosFromInputs(input: {
  price: number | null;
  ttmEps: number | null;
  forwardEps: number | null;
}): StockPeRatios {
  const peRatio =
    input.price != null && input.price > 0 && input.ttmEps != null && input.ttmEps > 0
      ? roundPeRatio(input.price / input.ttmEps)
      : null;
  const forwardPeRatio =
    input.price != null && input.price > 0 && input.forwardEps != null && input.forwardEps > 0
      ? roundPeRatio(input.price / input.forwardEps)
      : null;
  return { peRatio, forwardPeRatio };
}

function ttmEpsFromQuarters(quarters: QuarterlyFinancials[], sharesOutstanding: number | null): number | null {
  const epsRows = quarters
    .map((q) => q.epsDiluted ?? q.epsBasic)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (epsRows.length >= 4) return epsRows.slice(0, 4).reduce((sum, v) => sum + v, 0);

  const niRows = quarters
    .map((q) => q.netIncome)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (niRows.length >= 4 && sharesOutstanding != null && sharesOutstanding > 0) {
    return niRows.slice(0, 4).reduce((sum, v) => sum + v, 0) / sharesOutstanding;
  }
  return null;
}

function forwardEpsProxyFromQuarters(quarters: QuarterlyFinancials[]): number | null {
  const latest = quarters[0];
  const latestEps = latest?.epsDiluted ?? latest?.epsBasic ?? null;
  if (latestEps != null && Number.isFinite(latestEps) && latestEps > 0) return latestEps * 4;
  return null;
}

/**
 * Trailing and forward PE from Polygon price + financials, with Yahoo fallback when filings are missing.
 */
export async function resolveStockPeRatios(ticker: string): Promise<StockPeRatios> {
  const [priceRes, detailsRes, financialsRes, yahoo] = await Promise.all([
    getStockPrice(ticker),
    getTickerDetails(ticker),
    getFinancials(ticker),
    fetchYahooPeMetrics(ticker),
  ]);

  const price = priceRes.ok ? priceRes.data.close : yahoo.currentPrice;
  const shares = detailsRes.ok ? detailsRes.data.sharesOutstanding : null;
  const quarters = financialsRes.ok ? financialsRes.data.quarters : [];

  let ttmEps = ttmEpsFromQuarters(quarters, shares);
  let forwardEps = forwardEpsProxyFromQuarters(quarters);

  if (ttmEps == null && yahoo.trailingEps != null && yahoo.trailingEps >= 0.1) {
    ttmEps = yahoo.trailingEps;
  }
  if (forwardEps == null && yahoo.forwardEps != null && yahoo.forwardEps > 0) {
    forwardEps = yahoo.forwardEps;
  }

  const fromCalc = computePeRatiosFromInputs({ price, ttmEps, forwardEps });

  return {
    peRatio: fromCalc.peRatio ?? roundPeRatio(yahoo.trailingPe),
    forwardPeRatio: fromCalc.forwardPeRatio ?? roundPeRatio(yahoo.forwardPe),
  };
}

export function peRatiosFromFinancialsBundle(
  bundle: FinancialsBundle,
  price: number | null,
  sharesOutstanding: number | null,
): StockPeRatios {
  return computePeRatiosFromInputs({
    price,
    ttmEps: ttmEpsFromQuarters(bundle.quarters, sharesOutstanding),
    forwardEps: forwardEpsProxyFromQuarters(bundle.quarters),
  });
}

/**
 * Phase 2 integration check — Polygon.io + SEC EDGAR utilities.
 * Run: npm run test:polygon
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import {
  getFinancials,
  getGoldPriceHistory,
  getInsiderTransactions,
  getInstitutionalOwnership,
  getPriceHistory,
  getStockPrice,
  getTickerDetails,
} from "../src/lib/polygon";
import { getInsiderTransactions as getEdgarInsider, getInstitutionalHoldings } from "../src/lib/sec-edgar";

const TICKERS = ["NEM", "GOLD", "AEM"] as const;

function logResult(label: string, result: { ok: boolean; error?: string }, extra?: string) {
  if (result.ok) {
    console.log(`  ✓ ${label}${extra ? `: ${extra}` : ""}`);
  } else {
    console.log(`  ✗ ${label}: ${result.error}`);
  }
}

async function testTicker(ticker: string) {
  console.log(`\n── ${ticker} ──`);

  const price = await getStockPrice(ticker);
  logResult(
    "getStockPrice",
    price,
    price.ok ? `$${price.data.close.toFixed(2)} (${price.data.date})` : undefined,
  );

  const details = await getTickerDetails(ticker);
  logResult(
    "getTickerDetails",
    details,
    details.ok
      ? `${details.data.name} | mcap=${details.data.marketCap ?? "n/a"}`
      : undefined,
  );

  const financials = await getFinancials(ticker);
  logResult(
    "getFinancials",
    financials,
    financials.ok ? `${financials.data.quarters.length} quarter(s)` : undefined,
  );
  if (financials.ok && financials.data.quarters[0]) {
    const q = financials.data.quarters[0];
    console.log(
      `      latest: rev=${q.revenue ?? "n/a"} fcf=${q.freeCashFlow ?? "n/a"} ni=${q.netIncome ?? "n/a"}`,
    );
  }

  const history = await getPriceHistory(ticker, 30);
  logResult(
    "getPriceHistory(30d)",
    history,
    history.ok ? `${history.data.length} bars` : undefined,
  );

  const inst = await getInstitutionalOwnership(ticker);
  if (inst.ok) {
    console.log(
      `  ✓ getInstitutionalOwnership: ${inst.data ? `${inst.data.ownershipPercent ?? "n/a"}%` : "not available on plan"}`,
    );
  } else {
    console.log(`  ✗ getInstitutionalOwnership: ${inst.error}`);
  }

  const insiders = await getInsiderTransactions(ticker);
  if (insiders.ok) {
    console.log(
      `  ✓ getInsiderTransactions (Polygon): ${insiders.data ? `${insiders.data.length} rows` : "not available on plan"}`,
    );
  } else {
    console.log(`  ✗ getInsiderTransactions (Polygon): ${insiders.error}`);
  }

  const edgarInsider = await getEdgarInsider(ticker);
  logResult(
    "getInsiderTransactions (SEC)",
    edgarInsider,
    edgarInsider.ok ? `${edgarInsider.data.length} Form 4 filing(s)` : undefined,
  );

  const edgar13f = await getInstitutionalHoldings(ticker);
  logResult(
    "getInstitutionalHoldings (SEC EFTS)",
    edgar13f,
    edgar13f.ok ? `${edgar13f.data.length} 13F hit(s)` : undefined,
  );
}

async function main() {
  if (!process.env.POLYGON_API_KEY?.trim()) {
    console.warn("Warning: POLYGON_API_KEY is not set — Polygon calls will fail.\n");
  }

  console.log("Gold price proxy (GLD, 30d)…");
  const gold = await getGoldPriceHistory(30);
  logResult("getGoldPriceHistory", gold, gold.ok ? `${gold.data.length} bars` : undefined);

  for (const t of TICKERS) {
    await testTicker(t);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

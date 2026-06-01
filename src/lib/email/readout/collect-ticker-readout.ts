import type { TickerReadout, TickerReadoutInsider, TickerReadoutInstitutional } from "@/lib/email/readout/types";
import { getInstitutionalForTicker } from "@/lib/stock-detail/institutional";
import { getFundHoldersForTicker } from "@/lib/stock-detail/funds";
import { loadLargeStakesForTicker } from "@/lib/stock-detail/stakes";
import { formatAsOfDate, formatInsiderNetLabel, formatMarketCapDisplay } from "@/lib/stock-facts-format";
import { getStockFactsModel } from "@/lib/stock-facts";
import { isTrackedTicker } from "@/lib/portfolio-universe";
import { stockPath } from "@/lib/paths";
import { normalizeTicker } from "@/lib/polygon";

function pickInsiderTeachingKey(rows: { title: string }[]): string {
  const roles = rows.map((r) => r.title.toLowerCase()).join(" ");
  if (roles.includes("ceo") || roles.includes("chief executive")) return "email_insider_ceo";
  return "email_insider_default";
}

function pickInstitutionalTeachingKey(inst: {
  newPositions: number;
  exits: number;
  reductions: number;
}): string {
  if (inst.exits > 0) return "email_institutional_exits";
  if (inst.newPositions > 0) return "email_institutional_new";
  if (inst.reductions > 0) return "email_institutional_trim";
  return "email_institutional_default";
}

function buildInsiderSection(
  insider: TickerReadoutInsider["transactions"],
  net90d: number | null,
  asOf: string | null,
): TickerReadoutInsider {
  const net = formatInsiderNetLabel(net90d);
  return {
    available: insider.length > 0 || net90d != null,
    net90dLabel: net.text,
    asOfLabel: formatAsOfDate(asOf),
    transactions: insider.slice(0, 8),
    teachingKey: pickInsiderTeachingKey(insider),
  };
}

function buildInstitutionalSection(
  inst: Awaited<ReturnType<typeof getInstitutionalForTicker>>["institutional"],
  fundHolders: Awaited<ReturnType<typeof getFundHoldersForTicker>>,
): TickerReadoutInstitutional {
  const teachingKey = pickInstitutionalTeachingKey(inst);
  return {
    available: inst.available && inst.holderCount > 0,
    holderCount: inst.holderCount,
    periodLabel: inst.periodLabel,
    netChangeSummary: inst.netChangeSummary,
    fundNames: fundHolders.slice(0, 8).map((f) => f.name),
    teachingKey,
  };
}

/**
 * Builds one per-ticker readout from stored cache + Supabase 13F data only (no live Polygon/SEC calls).
 */
export async function collectStoredTickerReadout(rawTicker: string): Promise<TickerReadout> {
  const ticker = normalizeTicker(rawTicker);
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://goldsignal.ai").replace(/\/$/, "");
  const stockPageUrl = `${siteBase}${stockPath(ticker)}`;

  const [facts, tracked, institutionalBundle, largeStakes, fundHolders] = await Promise.all([
    getStockFactsModel(ticker),
    isTrackedTicker(ticker),
    getInstitutionalForTicker(ticker),
    Promise.resolve(loadLargeStakesForTicker(ticker)),
    getFundHoldersForTicker(ticker),
  ]);

  const onFile = tracked || facts != null;

  if (!onFile) {
    return {
      ticker,
      companyName: ticker,
      onFile: false,
      marketCap: null,
      insider: {
        available: false,
        net90dLabel: "No recent activity on file",
        asOfLabel: null,
        transactions: [],
        teachingKey: "email_insider_default",
      },
      institutional: {
        available: false,
        holderCount: 0,
        periodLabel: null,
        netChangeSummary: null,
        fundNames: [],
        teachingKey: "email_institutional_default",
      },
      largeStakes: [],
      stakeTeachingKey: "stake_13d_default",
      stockPageUrl,
    };
  }

  const companyName = facts?.name ?? ticker;
  const insider = buildInsiderSection(
    facts?.insider ?? [],
    facts?.insiderNet90dUsd ?? null,
    facts?.insiderAsOf ?? facts?.lastUpdated ?? null,
  );

  const institutional = buildInstitutionalSection(institutionalBundle.institutional, fundHolders);

  if (institutional.fundNames.length === 0 && fundHolders.length > 0) {
    institutional.fundNames = fundHolders.slice(0, 8).map((f) => f.name);
    if (fundHolders.length > 0 && institutional.holderCount === 0) {
      institutional.holderCount = fundHolders.length;
      institutional.available = true;
    }
  }

  return {
    ticker,
    companyName,
    onFile: true,
    marketCap: facts?.marketCap != null ? formatMarketCapDisplay(facts.marketCap) : null,
    insider,
    institutional,
    largeStakes,
    stakeTeachingKey: largeStakes.some((s) => s.kind === "stake_13d") ? "stake_13d_default" : "stake_13g_default",
    stockPageUrl,
  };
}

/**
 * Collects readouts for all sanitized tickers; invalid tokens should be filtered before calling.
 */
export async function collectReadoutForTickers(tickers: string[]): Promise<{
  readouts: TickerReadout[];
  skippedInvalid: string[];
}> {
  const readouts: TickerReadout[] = [];
  for (const t of tickers) {
    readouts.push(await collectStoredTickerReadout(t));
  }
  return { readouts, skippedInvalid: [] };
}

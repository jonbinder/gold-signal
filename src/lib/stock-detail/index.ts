import { cache } from "react";
import { formatMetalTag } from "@/lib/stock-category-labels";
import { getStockDetailCharts } from "@/lib/stock-detail/chart-data";
import { getPublishedInvestorsForTicker } from "@/lib/investors/queries";
import { getInstitutionalForTicker } from "@/lib/stock-detail/institutional";
import { loadLargeStakesForTicker } from "@/lib/stock-detail/stakes";
import type { StockDetailPageModel } from "@/lib/stock-detail/types";
import { getStockFactsModel } from "@/lib/stock-facts";

function pickInsiderTeachingKey(insider: { title: string }[]): string {
  const roles = insider.map((r) => r.title.toLowerCase()).join(" ");
  if (roles.includes("ceo") || roles.includes("chief executive")) return "stock_insider_ceo";
  return "stock_insider_default";
}

function pickInstitutionalTeachingKey(institutional: {
  newPositions: number;
  exits: number;
  reductions: number;
}): string {
  if (institutional.exits > 0) return "stock_institutional_exits";
  if (institutional.newPositions > 0) return "stock_institutional_new";
  if (institutional.reductions > 0) return "stock_institutional_trim";
  return "stock_institutional_default";
}

export const getStockDetailPage = cache(async (ticker: string): Promise<StockDetailPageModel | null> => {
  const facts = await getStockFactsModel(ticker);
  if (!facts) return null;

  const [{ institutional, fundHolders }, largeStakes, charts, trackedInvestors] = await Promise.all([
    getInstitutionalForTicker(facts.ticker),
    Promise.resolve(loadLargeStakesForTicker(facts.ticker)),
    getStockDetailCharts(facts.ticker, facts.insider, facts.priceHistory12m),
    getPublishedInvestorsForTicker(facts.ticker),
  ]);

  return {
    ...facts,
    metalTag: formatMetalTag(facts.subCategory),
    institutional,
    fundHolders,
    trackedInvestors,
    largeStakes,
    charts,
    teachingKeys: {
      insider: pickInsiderTeachingKey(facts.insider),
      institutional: pickInstitutionalTeachingKey(institutional),
    },
  };
});

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { buildMonthlyInsiderBars, type MonthlyInsiderBar } from "@/lib/charts/insider-series";
import {
  buildPriceTimeline12m,
  MIN_PRICE_CHART_POINTS,
  type CachedPricePoint,
  type PriceTimelinePoint,
} from "@/lib/charts/price-series";
import type { InsiderTransactionRow } from "@/lib/form4-insider";
import { getTrackedFundSlugs } from "@/lib/funds/config";
import { fetchLatestReportingPeriod } from "@/lib/reporting-periods";

export type InstitutionalTrendPoint = {
  periodLabel: string;
  periodEnd: string;
  holderCount: number;
  totalValueUsd: number;
};

export type HolderCountSnapshot = {
  current: number;
  prior: number | null;
  periodLabel: string | null;
  priorPeriodLabel: string | null;
  sparkline: number[];
};

export type ConcentrationSlice = {
  trackedUsd: number;
  otherUsd: number;
  trackedPct: number;
  otherPct: number;
};

export type StockDetailChartsModel = {
  priceTimeline: PriceTimelinePoint[];
  hasPriceChart: boolean;
  insiderTimeline: MonthlyInsiderBar[];
  hasInsiderChart: boolean;
  holderCount: HolderCountSnapshot | null;
  institutionalTrend: InstitutionalTrendPoint[];
  hasInstitutionalTrend: boolean;
  concentration: ConcentrationSlice | null;
};

const EMPTY_CHARTS: StockDetailChartsModel = {
  priceTimeline: [],
  hasPriceChart: false,
  insiderTimeline: [],
  hasInsiderChart: false,
  holderCount: null,
  institutionalTrend: [],
  hasInstitutionalTrend: false,
  concentration: null,
};

function priceChartsFromCache(cached: CachedPricePoint[]): Pick<
  StockDetailChartsModel,
  "priceTimeline" | "hasPriceChart"
> {
  const priceTimeline = buildPriceTimeline12m(cached, 12);
  return {
    priceTimeline,
    hasPriceChart: priceTimeline.length >= MIN_PRICE_CHART_POINTS,
  };
}

type HoldingPeriodRow = {
  period_id: string;
  value_usd: number | null;
  investor: { slug: string } | { slug: string }[] | null;
};

function investorSlug(
  inv: HoldingPeriodRow["investor"],
): string | undefined {
  if (!inv) return undefined;
  return Array.isArray(inv) ? inv[0]?.slug : inv.slug;
}

async function loadChartData(
  ticker: string,
  insider: InsiderTransactionRow[],
  priceHistory12m: CachedPricePoint[],
): Promise<StockDetailChartsModel> {
  const insiderTimeline = buildMonthlyInsiderBars(insider, 12);
  const hasInsiderChart = insiderTimeline.some((m) => m.buyUsd > 0 || m.sellUsd > 0);
  const priceCharts = priceChartsFromCache(priceHistory12m);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return { ...EMPTY_CHARTS, ...priceCharts, insiderTimeline, hasInsiderChart };
  }

  const supabase = createClient(url, key);
  const sym = ticker.trim().toUpperCase();

  const { data: security } = await supabase
    .from("securities")
    .select("id")
    .eq("ticker", sym)
    .maybeSingle();

  if (!security?.id) {
    return { ...EMPTY_CHARTS, ...priceCharts, insiderTimeline, hasInsiderChart };
  }

  const latestPeriod = await fetchLatestReportingPeriod(supabase);
  if (!latestPeriod?.id) {
    return { ...EMPTY_CHARTS, ...priceCharts, insiderTimeline, hasInsiderChart };
  }

  const { data: periods } = await supabase
    .from("reporting_periods")
    .select("id, label, period_end")
    .lte("period_end", latestPeriod.period_end)
    .order("period_end", { ascending: false })
    .limit(8);

  if (!periods?.length) {
    return { ...EMPTY_CHARTS, ...priceCharts, insiderTimeline, hasInsiderChart };
  }

  const periodIds = periods.map((p) => p.id);
  const trackedSlugs = await getTrackedFundSlugs();

  const [{ data: statsRows }, { data: holdingsRaw }] = await Promise.all([
    supabase
      .from("security_ownership_stats")
      .select("period_id, owner_count, total_value_usd")
      .eq("security_id", security.id)
      .in("period_id", periodIds),
    supabase
      .from("holdings")
      .select("period_id, value_usd, investor:investors(slug)")
      .eq("security_id", security.id)
      .in("period_id", periodIds),
  ]);

  const statsByPeriod = new Map(
    (statsRows ?? []).map((s) => [
      s.period_id as string,
      {
        ownerCount: Number(s.owner_count) || 0,
        totalValueUsd: Number(s.total_value_usd) || 0,
      },
    ]),
  );

  const trackedCountByPeriod = new Map<string, number>();
  const trackedValueByPeriod = new Map<string, number>();

  for (const row of (holdingsRaw ?? []) as HoldingPeriodRow[]) {
    const slug = investorSlug(row.investor);
    if (!slug || !trackedSlugs.has(slug)) continue;
    const pid = row.period_id;
    trackedCountByPeriod.set(pid, (trackedCountByPeriod.get(pid) ?? 0) + 1);
    const v = row.value_usd != null ? Number(row.value_usd) : 0;
    trackedValueByPeriod.set(pid, (trackedValueByPeriod.get(pid) ?? 0) + v);
  }

  const chronological = [...periods].reverse();
  const institutionalTrend: InstitutionalTrendPoint[] = chronological.map((p) => {
    const tracked = trackedCountByPeriod.get(p.id) ?? 0;
    const stats = statsByPeriod.get(p.id);
    const holderCount = tracked > 0 ? tracked : (stats?.ownerCount ?? 0);
    return {
      periodLabel: p.label,
      periodEnd: p.period_end,
      holderCount,
      totalValueUsd: stats?.totalValueUsd ?? trackedValueByPeriod.get(p.id) ?? 0,
    };
  });

  const hasInstitutionalTrend =
    institutionalTrend.length >= 2 &&
    institutionalTrend.some((pt) => pt.holderCount > 0);

  const latest = periods[0];
  const prior = periods[1];
  const currentCount =
    trackedCountByPeriod.get(latest.id) ??
    statsByPeriod.get(latest.id)?.ownerCount ??
    0;
  const priorCount =
    prior != null
      ? (trackedCountByPeriod.get(prior.id) ?? statsByPeriod.get(prior.id)?.ownerCount ?? null)
      : null;

  const sparkline = institutionalTrend.map((pt) => pt.holderCount);

  const holderCount: HolderCountSnapshot | null =
    currentCount > 0 || (priorCount != null && priorCount > 0)
      ? {
          current: currentCount,
          prior: priorCount,
          periodLabel: latest.label,
          priorPeriodLabel: prior?.label ?? null,
          sparkline,
        }
      : null;

  const trackedUsd = trackedValueByPeriod.get(latest.id) ?? 0;
  const totalUsd = statsByPeriod.get(latest.id)?.totalValueUsd ?? 0;
  const otherUsd = Math.max(0, totalUsd - trackedUsd);

  let concentration: ConcentrationSlice | null = null;
  if (trackedUsd > 0 && totalUsd > 0) {
    const trackedPct = Math.round((trackedUsd / totalUsd) * 1000) / 10;
    const otherPct = Math.round((otherUsd / totalUsd) * 1000) / 10;
    concentration = { trackedUsd, otherUsd, trackedPct, otherPct };
  } else if (trackedUsd > 0) {
    concentration = { trackedUsd, otherUsd: 0, trackedPct: 100, otherPct: 0 };
  }

  return {
    ...priceCharts,
    insiderTimeline,
    hasInsiderChart,
    holderCount,
    institutionalTrend,
    hasInstitutionalTrend,
    concentration,
  };
}

export const getStockDetailCharts = cache(
  (ticker: string, insider: InsiderTransactionRow[], priceHistory12m: CachedPricePoint[]) =>
    loadChartData(ticker, insider, priceHistory12m),
);

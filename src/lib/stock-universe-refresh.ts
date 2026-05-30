import fs from "fs";
import path from "path";
import {
  rankStockFromMarketData,
  isSignalAvailable,
  FOOTPRINT_KEYS,
  type FootprintKey,
  type SubScoreKey,
  type StockRankingResult,
} from "@/lib/ranking";
import { getStockPrice, getTickerDetails, normalizeTicker } from "@/lib/polygon";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type { TrackedStock, TrackedStocksFile } from "@/lib/tracked-stocks";

const SUB_SCORE_KEYS = FOOTPRINT_KEYS as readonly FootprintKey[];
const STALE_HOURS = 20;
export const REFRESH_BATCH_SIZE = 25;

export type DataStatus = "healthy" | "partial" | "error" | "pending";

export function loadTrackedStocksFile(): TrackedStock[] {
  const filePath = path.join(process.cwd(), "data", "tracked-stocks.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as TrackedStocksFile;
  return parsed.stocks ?? [];
}

function pctAbove52WeekLow(current: number, low: number): number | null {
  if (low <= 0) return null;
  return ((current - low) / low) * 100;
}

/**
 * Applies signal_coverage and defaulted source tags for cache storage.
 */
export function buildCacheMetricsFromRanking(ranking: StockRankingResult): {
  signalCoverage: number;
  rawMetrics: Record<string, unknown>;
  subScoreColumns: Record<string, number | null>;
} {
  let signalCoverage = 0;
  const rawMetrics: Record<string, unknown> = { ...ranking.rawMetrics };

  const subScoreColumns: Record<string, number | null> = {};

  const columnMap: Record<SubScoreKey, string> = {
    institutional: "institutional_score",
    insider: "insider_score",
    pe: "pe_score",
    famousInvestor: "famous_investor_score",
    support: "support_score",
    correlation: "correlation_score",
    fcfYield: "fcf_yield_score",
  };

  for (const key of SUB_SCORE_KEYS) {
    const sub = ranking.subScores[key];
    if (!isSignalAvailable(sub)) {
      rawMetrics[`${key}_source`] = "defaulted";
      subScoreColumns[columnMap[key]] = null;
    } else {
      signalCoverage++;
      rawMetrics[`${key}_source`] = "computed";
      subScoreColumns[columnMap[key]] = sub.score;
    }
  }

  return { signalCoverage, rawMetrics, subScoreColumns };
}

function dataStatusFromCoverage(coverage: number, fetchFailed: boolean): DataStatus {
  if (fetchFailed) return "error";
  if (coverage >= 3) return "healthy";
  if (coverage >= 1) return "partial";
  return "error";
}

/**
 * Refreshes one ticker into stock_data_cache.
 */
export async function refreshOneStock(tracked: TrackedStock): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, error: "Supabase not configured" };
  }

  const sym = normalizeTicker(tracked.ticker);
  let fetchFailed = false;

  try {
    const [priceRes, detailsRes] = await Promise.all([getStockPrice(sym), getTickerDetails(sym)]);

    if (!priceRes.ok) fetchFailed = true;

    const price = priceRes.ok ? priceRes.data.close : null;
    const previousClose =
      detailsRes.ok && typeof detailsRes.data.raw === "object"
        ? (detailsRes.data.raw as { prev_close?: number }).prev_close ?? null
        : null;

    let dailyChangePct: number | null = null;
    if (price != null && previousClose != null && previousClose > 0) {
      dailyChangePct = ((price - previousClose) / previousClose) * 100;
    }

    const ranking = await rankStockFromMarketData(sym);
    const { signalCoverage, rawMetrics, subScoreColumns } = buildCacheMetricsFromRanking(ranking);

    let peRatio: number | null = null;
    const inputs = rawMetrics.inputs as { pe?: { trailingPe?: number | null } } | undefined;
    if (inputs?.pe?.trailingPe != null && inputs.pe.trailingPe > 0) {
      peRatio = inputs.pe.trailingPe;
    }

    let pctAbove52: number | null = null;
    const supportInputs = inputs as {
      support?: { currentPrice?: number; fiftyTwoWeekLow?: number };
    } | undefined;
    if (supportInputs?.support?.currentPrice != null && supportInputs?.support?.fiftyTwoWeekLow != null) {
      pctAbove52 = pctAbove52WeekLow(
        supportInputs.support.currentPrice,
        supportInputs.support.fiftyTwoWeekLow,
      );
    }

    const marketCap = detailsRes.ok ? detailsRes.data.marketCap : null;
    const dataStatus = dataStatusFromCoverage(signalCoverage, fetchFailed);

    const row = {
      ticker: sym,
      name: tracked.name || ranking.companyName || sym,
      category: tracked.category,
      sub_category: tracked.sub_category,
      exchange: tracked.exchange,
      logo_url: tracked.logo_url,
      price,
      previous_close: previousClose,
      daily_change_pct: dailyChangePct,
      market_cap: marketCap,
      pe_ratio: peRatio,
      pct_above_52_week_low: pctAbove52,
      signal_score: fetchFailed || !ranking.scoreAvailable ? null : ranking.signalScore,
      ...subScoreColumns,
      signal_coverage: signalCoverage,
      raw_metrics: rawMetrics,
      data_status: dataStatus,
      last_updated: new Date().toISOString(),
      error_message: !priceRes.ok ? priceRes.error : null,
    };

    const { error } = await supabase.from("stock_data_cache").upsert(row, { onConflict: "ticker" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown refresh error";
    await supabase.from("stock_data_cache").upsert(
      {
        ticker: sym,
        name: tracked.name,
        category: tracked.category,
        sub_category: tracked.sub_category,
        exchange: tracked.exchange,
        logo_url: tracked.logo_url,
        data_status: "error",
        error_message: message,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "ticker" },
    );
    return { ok: false, error: message };
  }
}

/**
 * Returns tickers from master list that need refresh (not updated in last 20 hours).
 */
export async function tickersNeedingRefresh(): Promise<TrackedStock[]> {
  const all = loadTrackedStocksFile();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return all;

  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("stock_data_cache").select("ticker, last_updated");

  if (error) {
    console.warn("[refresh-stocks] Cache read failed:", error.message);
    return all;
  }

  const fresh = new Set<string>();
  for (const row of data ?? []) {
    if (row.last_updated && row.last_updated >= cutoff) {
      fresh.add(row.ticker);
    }
  }

  return all.filter((s) => !fresh.has(normalizeTicker(s.ticker)));
}

/**
 * Processes one batch of stocks needing refresh.
 */
export async function processRefreshBatch(batchIndex: number): Promise<{
  batch: number;
  processed: number;
  failed: number;
  remaining: number;
  done: boolean;
}> {
  const pending = await tickersNeedingRefresh();
  const slice = pending.slice(0, REFRESH_BATCH_SIZE);

  if (slice.length === 0) {
    return { batch: batchIndex, processed: 0, failed: 0, remaining: 0, done: true };
  }

  let processed = 0;
  let failed = 0;

  for (const tracked of slice) {
    const result = await refreshOneStock(tracked);
    if (result.ok) processed++;
    else {
      failed++;
      console.warn("[refresh-stocks] Ticker failed", {
        ticker: tracked.ticker,
        error: result.error,
      });
    }
  }

  const remaining = Math.max(0, pending.length - slice.length);
  const done = remaining === 0;

  console.info("[refresh-stocks] Batch complete", {
    batch: batchIndex,
    processed,
    failed,
    remaining,
    total: pending.length,
  });

  return { batch: batchIndex, processed, failed, remaining, done };
}

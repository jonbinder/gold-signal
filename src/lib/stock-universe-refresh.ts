import fs from "fs";
import path from "path";
import {
  computeInsiderNet90dUsd,
  fetchForm4Transactions,
} from "@/lib/form4-insider";
import { getTrackedFundHolderCount } from "@/lib/funds/holder-count";
import { getStockPrice, getTickerDetails, normalizeTicker } from "@/lib/polygon";
import { resolvePctAbove52WeekLow } from "@/lib/stock-52w-metrics";
import { formatDisplayCompanyName } from "@/lib/format-company-name";
import { resolveStockPeRatios } from "@/lib/stock-pe-ratios";
import { resolveStockLogoServePath } from "@/lib/stock-branding";
import { fetchYahooSupplement, getPolygonTickerDetails } from "@/lib/stock-profile";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type { TrackedStock, TrackedStocksFile } from "@/lib/tracked-stocks";

/** Default off — ranking lives in @/lib/ranking (dormant). Set SCORING_ENABLED=true to recompute scores in cache. */
const SCORING_ENABLED = process.env.SCORING_ENABLED === "true";
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

export { buildCacheMetricsFromRanking } from "@/lib/stock-universe-refresh-scoring";

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

    const [polygonDetails, insiderResult, yahoo, trackedFundCount] = await Promise.all([
      getPolygonTickerDetails(sym),
      fetchForm4Transactions(sym),
      fetchYahooSupplement(sym),
      getTrackedFundHolderCount(sym),
    ]);
    const insiderRows = insiderResult.rows;
    const insiderNet90d = computeInsiderNet90dUsd(insiderRows);
    const nowIso = new Date().toISOString();

    let signalCoverage = 0;
    let rawMetrics: Record<string, unknown> = {};
    let subScoreColumns: Record<string, number | null> = {};
    let rankingCompanyName = sym;
    let signalScore: number | null = null;

    if (SCORING_ENABLED) {
      const { computeScoringCacheFields } = await import("@/lib/stock-universe-refresh-scoring");
      const scored = await computeScoringCacheFields(sym, fetchFailed);
      rankingCompanyName = scored.rankingCompanyName;
      signalScore = scored.signalScore;
      signalCoverage = scored.signalCoverage;
      rawMetrics = scored.rawMetrics;
      subScoreColumns = scored.subScoreColumns;
    }

    const inputs = rawMetrics.inputs as {
      pe?: { trailingPe?: number | null };
      support?: { currentPrice?: number; fiftyTwoWeekLow?: number };
    } | undefined;

    let peRatio: number | null = null;
    let forwardPeRatio: number | null = null;
    if (SCORING_ENABLED) {
      if (inputs?.pe?.trailingPe != null && inputs.pe.trailingPe > 0) {
        peRatio = inputs.pe.trailingPe;
      }
    } else {
      const pe = await resolveStockPeRatios(sym);
      peRatio = pe.peRatio;
      forwardPeRatio = pe.forwardPeRatio;
    }

    let pctAbove52: number | null = null;
    const supportInputs = inputs as {
      support?: { currentPrice?: number; fiftyTwoWeekLow?: number };
    } | undefined;
    if (
      SCORING_ENABLED &&
      supportInputs?.support?.currentPrice != null &&
      supportInputs?.support?.fiftyTwoWeekLow != null
    ) {
      pctAbove52 = pctAbove52WeekLow(
        supportInputs.support.currentPrice,
        supportInputs.support.fiftyTwoWeekLow,
      );
    } else if (price != null) {
      pctAbove52 = await resolvePctAbove52WeekLow(sym, price);
    }

    const marketCap =
      polygonDetails?.market_cap ?? (detailsRes.ok ? detailsRes.data.marketCap : null);
    const hasFacts = insiderRows.length > 0 || marketCap != null;
    const dataStatus = SCORING_ENABLED
      ? dataStatusFromCoverage(signalCoverage, fetchFailed)
      : fetchFailed
        ? "error"
        : hasFacts
          ? "healthy"
          : "partial";

    const logoUrl = resolveStockLogoServePath(sym, polygonDetails);

    const row = {
      ticker: sym,
      name: formatDisplayCompanyName(
        tracked.name || polygonDetails?.name || rankingCompanyName || sym,
      ),
      category: tracked.category,
      sub_category: tracked.sub_category,
      exchange: tracked.exchange,
      logo_url: logoUrl,
      price,
      previous_close: previousClose,
      daily_change_pct: dailyChangePct,
      market_cap: marketCap,
      pe_ratio: peRatio,
      forward_pe_ratio: forwardPeRatio,
      pct_above_52_week_low: pctAbove52,
      company_description: polygonDetails?.description ?? null,
      ceo: yahoo.ceo,
      famous_holder_count: trackedFundCount,
      famous_holders: [],
      insider_transactions: insiderRows,
      insider_net_90d_usd: insiderNet90d,
      insider_as_of: nowIso,
      signal_score: signalScore,
      ...subScoreColumns,
      signal_coverage: signalCoverage,
      raw_metrics: rawMetrics,
      data_status: dataStatus,
      last_updated: nowIso,
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

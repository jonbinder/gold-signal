import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  buildMonthlyInsiderBars,
  heatmapIntensity,
  recentMonthKeys,
} from "@/lib/charts/insider-series";
import type { InsiderTransactionRow } from "@/lib/form4-insider";
import { stockPath } from "@/lib/paths";
import { normalizeTicker } from "@/lib/polygon";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";

export type HeatmapCell = {
  monthKey: string;
  intensity: number;
  buyUsd: number;
  sellUsd: number;
};

export type HeatmapRow = {
  ticker: string;
  name: string;
  cells: HeatmapCell[];
  totalActivity: number;
  stockHref: `/stocks/${string}` | null;
};

export type SectorInsiderHeatmapModel = {
  monthLabels: string[];
  monthKeys: string[];
  rows: HeatmapRow[];
  limited: boolean;
};

const MAX_ROWS = 24;
const MONTH_COUNT = 6;

function parseInsider(raw: unknown): InsiderTransactionRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is InsiderTransactionRow =>
      r != null &&
      typeof r === "object" &&
      (r as InsiderTransactionRow).type != null,
  );
}

async function loadSectorHeatmap(): Promise<SectorInsiderHeatmapModel> {
  const monthKeys = recentMonthKeys(MONTH_COUNT);
  const monthLabels = monthKeys.map((k) => {
    const [y, m] = k.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      new Date(Date.UTC(y, m - 1, 1)),
    );
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return { monthKeys, monthLabels, rows: [], limited: false };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("stock_data_cache")
    .select("ticker, name, insider_transactions")
    .order("market_cap", { ascending: false, nullsFirst: false });

  if (error || !data?.length) {
    return { monthKeys, monthLabels, rows: [], limited: false };
  }

  const tracked = new Set(loadTrackedStocksSync().map((s) => s.ticker));
  const candidates: HeatmapRow[] = [];

  for (const row of data) {
    const insider = parseInsider(row.insider_transactions);
    const monthly = buildMonthlyInsiderBars(insider, MONTH_COUNT);
    const cells: HeatmapCell[] = monthly.map((m) => ({
      monthKey: m.monthKey,
      buyUsd: m.buyUsd,
      sellUsd: m.sellUsd,
      intensity: heatmapIntensity(m.buyUsd, m.sellUsd),
    }));
    const totalActivity = cells.reduce((s, c) => s + c.buyUsd + c.sellUsd, 0);
    if (totalActivity <= 0) continue;
    const ticker = normalizeTicker(String(row.ticker));
    candidates.push({
      ticker,
      name: (row.name as string) || ticker,
      cells,
      totalActivity,
      stockHref: tracked.has(ticker) ? stockPath(ticker) : null,
    });
  }

  candidates.sort((a, b) => b.totalActivity - a.totalActivity);
  const limited = candidates.length > MAX_ROWS;
  const rows = candidates.slice(0, MAX_ROWS);

  return { monthKeys, monthLabels, rows, limited };
}

export const getSectorInsiderHeatmap = cache(loadSectorHeatmap);

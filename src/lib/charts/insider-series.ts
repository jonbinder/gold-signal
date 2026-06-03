import type { InsiderTransactionRow } from "@/lib/form4-insider";

export type MonthlyInsiderBar = {
  monthKey: string;
  monthLabel: string;
  /** Center of month on 0–12 axis (aligned with price line chart). */
  monthIndex: number;
  buyUsd: number;
  sellUsd: number;
  /** Signed net for bar chart: buys positive, sells negative */
  netUsd: number;
};

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" });

function monthKeyFromIso(iso: string): string | null {
  const d = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return d.slice(0, 7);
}

function txUsd(row: InsiderTransactionRow): number {
  if (row.valueUsd != null && Number.isFinite(row.valueUsd) && row.valueUsd > 0) {
    return row.valueUsd;
  }
  if (row.shares != null && row.shares > 0) return row.shares;
  return 0;
}

/** Last N calendar months ending at current month (UTC). */
export function recentMonthKeys(monthCount: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    keys.push(`${y}-${m}`);
  }
  return keys;
}

export function labelForMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return MONTH_FMT.format(new Date(Date.UTC(y, m - 1, 1)));
}

/**
 * Aggregate insider Form 4 rows into monthly buy/sell totals (~12 months).
 * Uses transaction value when present; otherwise share count as a relative proxy.
 */
export function buildMonthlyInsiderBars(
  rows: InsiderTransactionRow[],
  monthCount = 12,
): MonthlyInsiderBar[] {
  const keys = recentMonthKeys(monthCount);
  const earliest = keys[0];
  const buckets = new Map<string, { buyUsd: number; sellUsd: number }>();
  for (const k of keys) buckets.set(k, { buyUsd: 0, sellUsd: 0 });

  const cutoff = earliest;

  for (const row of rows) {
    const mk = monthKeyFromIso(row.dateIso || row.date);
    if (!mk || mk < cutoff) continue;
    if (!buckets.has(mk)) continue;
    const amt = txUsd(row);
    if (amt <= 0) continue;
    const b = buckets.get(mk)!;
    if (row.type === "BUY") b.buyUsd += amt;
    else b.sellUsd += amt;
  }

  return keys.map((monthKey, i) => {
    const { buyUsd, sellUsd } = buckets.get(monthKey)!;
    return {
      monthKey,
      monthLabel: labelForMonthKey(monthKey),
      monthIndex: i + 0.5,
      buyUsd,
      sellUsd,
      netUsd: buyUsd - sellUsd,
    };
  });
}

/** Normalized intensity for heatmap cells: -1 (sell) .. 0 (quiet) .. +1 (buy). */
export function heatmapIntensity(buyUsd: number, sellUsd: number): number {
  const net = buyUsd - sellUsd;
  const gross = buyUsd + sellUsd;
  if (gross <= 0) return 0;
  return Math.max(-1, Math.min(1, net / gross));
}

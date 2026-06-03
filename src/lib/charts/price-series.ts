import { labelForMonthKey, recentMonthKeys } from "@/lib/charts/insider-series";

/** Compact JSON stored in stock_data_cache.price_history_12m */
export type CachedPricePoint = { d: string; c: number };

export type PriceTimelinePoint = {
  date: string;
  close: number;
  /** 0–12 scale aligned with insider monthly bars (month centers at 0.5, 1.5, …). */
  monthIndex: number;
};

export const MIN_PRICE_CHART_POINTS = 20;

export const TWELVE_MONTH_X_DOMAIN: [number, number] = [0, 12];

/** Bar centers for a 12-month insider timeline (matches price chart tick positions). */
export function twelveMonthBarCenters(monthCount: number): number[] {
  return Array.from({ length: monthCount }, (_, i) => i + 0.5);
}

export function monthIndexFromIso(iso: string, monthKeys: string[]): number | null {
  const mk = iso.slice(0, 7);
  const idx = monthKeys.indexOf(mk);
  if (idx < 0) return null;
  const parts = iso.slice(0, 10).split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const day = parts[2];
  if (!y || !m || !day) return null;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return idx + (day - 1) / daysInMonth;
}

export function parseCachedPriceHistory(raw: unknown): CachedPricePoint[] {
  if (!Array.isArray(raw)) return [];
  const out: CachedPricePoint[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const d = (row as CachedPricePoint).d;
    const c = (row as CachedPricePoint).c;
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    if (typeof c !== "number" || !Number.isFinite(c) || c <= 0) continue;
    out.push({ d, c: Math.round(c * 100) / 100 });
  }
  return out.sort((a, b) => a.d.localeCompare(b.d));
}

export function compactPriceHistory12m(
  bars: { date: string; close: number }[],
  monthCount = 12,
): CachedPricePoint[] | null {
  const keys = recentMonthKeys(monthCount);
  const earliest = keys[0];
  const compact = bars
    .filter((b) => b.date.slice(0, 7) >= earliest && b.close > 0)
    .map((b) => ({
      d: b.date,
      c: Math.round(b.close * 100) / 100,
    }));
  if (compact.length < MIN_PRICE_CHART_POINTS) return null;
  return compact;
}

export function buildPriceTimeline12m(
  cached: CachedPricePoint[],
  monthCount = 12,
): PriceTimelinePoint[] {
  const keys = recentMonthKeys(monthCount);
  const points: PriceTimelinePoint[] = [];
  for (const row of cached) {
    const monthIndex = monthIndexFromIso(row.d, keys);
    if (monthIndex == null) continue;
    points.push({ date: row.d, close: row.c, monthIndex });
  }
  return points;
}

export function labelForMonthIndex(monthIndex: number, monthKeys: string[]): string {
  const idx = Math.min(monthKeys.length - 1, Math.max(0, Math.floor(monthIndex)));
  return labelForMonthKey(monthKeys[idx]!);
}

import { unstable_cache } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase";
import {
  goldSilverRatioChangePct,
  resolveGoldSpotQuote,
  resolveSilverSpotQuote,
} from "@/lib/metals-spot-quotes";

export const SPOT_REVALIDATE_SECONDS = 600;

export type MarketState = "open" | "closed_weekend" | "closed_overnight";

export type SpotSnapshot = {
  gold: number | null;
  silver: number | null;
  ratio: number | null;
  goldChangePct: number | null;
  silverChangePct: number | null;
  ratioChangePct: number | null;
  asOf: string | null;
  marketState: MarketState;
  /** True when serving a prior snapshot because the live provider fetch failed. */
  delayed: boolean;
  goldLabel: string;
  silverLabel: string;
};

const ET = "America/New_York";

type EtParts = {
  weekday: string;
  hour: number;
  minute: number;
  month: string;
  day: string;
};

function etParts(date: Date): EtParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ET,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    weekday: get("weekday"),
    hour: Number.parseInt(get("hour"), 10) || 0,
    minute: Number.parseInt(get("minute"), 10) || 0,
    month: get("month"),
    day: get("day"),
  };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** COMEX-style session windows for display labels (not a trading calendar). */
export function computeMarketState(now = new Date()): MarketState {
  const { weekday, hour } = etParts(now);
  const day = WEEKDAY_INDEX[weekday] ?? 0;

  if (day === 6) return "closed_weekend";
  if (day === 0 && hour < 18) return "closed_weekend";
  if (day === 5 && hour >= 17) return "closed_weekend";

  if (day >= 1 && day <= 5 && hour >= 8 && hour < 17) return "open";
  return "closed_overnight";
}

function lastSessionCloseLabel(now: Date): string {
  const p = etParts(now);
  const dayIdx = WEEKDAY_INDEX[p.weekday] ?? 0;

  let daysBack = 0;
  if (dayIdx === 6) daysBack = 1;
  else if (dayIdx === 0) daysBack = 2;
  else if (p.hour < 8) daysBack = 1;
  else if (p.hour >= 17) daysBack = 0;

  const d = new Date(now);
  d.setDate(d.getDate() - daysBack);
  const label = etParts(d);
  return `${label.weekday}, ${label.month} ${label.day}`;
}

/** User-facing freshness line driven by marketState + asOf. */
export function formatSpotFreshnessLabel(
  asOf: string | null,
  marketState: MarketState,
  delayed: boolean,
): string | null {
  if (delayed) return "Prices delayed";
  if (!asOf) return null;

  const asOfDate = new Date(asOf);
  if (Number.isNaN(asOfDate.getTime())) return null;

  const now = new Date();
  const ageMs = now.getTime() - asOfDate.getTime();

  if (marketState === "open") {
    if (ageMs >= 0 && ageMs < 60 * 60 * 1000) {
      const mins = Math.max(1, Math.round(ageMs / 60_000));
      if (mins < 60) return `Updated ${mins} min ago`;
    }
    const time = asOfDate.toLocaleString("en-US", {
      timeZone: ET,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return `Updated ${time}`;
  }

  if (marketState === "closed_weekend") {
    return `As of ${lastSessionCloseLabel(now)} market close`;
  }

  return `As of ${lastSessionCloseLabel(now)} market close`;
}

function emptySnapshot(delayed = false): SpotSnapshot {
  return {
    gold: null,
    silver: null,
    ratio: null,
    goldChangePct: null,
    silverChangePct: null,
    ratioChangePct: null,
    asOf: null,
    marketState: computeMarketState(),
    delayed,
    goldLabel: "Gold (USD/oz)",
    silverLabel: "Silver (USD/oz)",
  };
}

function buildSnapshot(
  gold: { price: number; changePct: number | null },
  silver: { price: number; changePct: number | null },
  asOf: string,
  delayed: boolean,
): SpotSnapshot {
  const ratio = gold.price / silver.price;
  return {
    gold: Math.round(gold.price * 100) / 100,
    silver: Math.round(silver.price * 1000) / 1000,
    ratio: Math.round(ratio * 100) / 100,
    goldChangePct: gold.changePct,
    silverChangePct: silver.changePct,
    ratioChangePct: goldSilverRatioChangePct(
      { price: gold.price, changePct: gold.changePct, sourceTicker: "GC=F" },
      { price: silver.price, changePct: silver.changePct, sourceTicker: "SI=F" },
    ),
    asOf,
    marketState: computeMarketState(new Date(asOf)),
    delayed,
    goldLabel: "Gold (USD/oz)",
    silverLabel: "Silver (USD/oz)",
  };
}

async function loadSupabaseFallback(): Promise<SpotSnapshot | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("metals_market_cache")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return null;

  const gold = typeof data.gold_price === "number" ? data.gold_price : null;
  const silver = typeof data.silver_price === "number" ? data.silver_price : null;
  if (gold == null || silver == null) return null;

  const asOf = (data.updated_at as string) ?? new Date().toISOString();
  return {
    gold,
    silver,
    ratio: typeof data.gold_silver_ratio === "number" ? data.gold_silver_ratio : gold / silver,
    goldChangePct: typeof data.gold_change_pct === "number" ? data.gold_change_pct : null,
    silverChangePct: typeof data.silver_change_pct === "number" ? data.silver_change_pct : null,
    ratioChangePct: typeof data.ratio_change_pct === "number" ? data.ratio_change_pct : null,
    asOf,
    marketState: computeMarketState(new Date(asOf)),
    delayed: true,
    goldLabel: (data.gold_label as string)?.trim() || "Gold (USD/oz)",
    silverLabel: (data.silver_label as string)?.trim() || "Silver (USD/oz)",
  };
}

async function fetchSpotSnapshotUncached(): Promise<SpotSnapshot> {
  try {
    const [gold, silver] = await Promise.all([resolveGoldSpotQuote(), resolveSilverSpotQuote()]);
    if (!gold || !silver) throw new Error("Spot gold/silver unavailable");
    return buildSnapshot(gold, silver, new Date().toISOString(), false);
  } catch (err) {
    console.warn("[spot-market] live fetch failed", err instanceof Error ? err.message : err);
    const fallback = await loadSupabaseFallback();
    if (fallback) return fallback;
    return emptySnapshot(true);
  }
}

const getSpotSnapshotCached = unstable_cache(fetchSpotSnapshotUncached, ["spot-snapshot-v1"], {
  revalidate: SPOT_REVALIDATE_SECONDS,
  tags: ["spot-prices"],
});

/** Cached spot snapshot for homepage + /api/spot (10-minute revalidate). */
export async function getSpotSnapshot(): Promise<SpotSnapshot> {
  return getSpotSnapshotCached();
}

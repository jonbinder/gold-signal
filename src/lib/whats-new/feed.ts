import fs from "fs";
import path from "path";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { InsiderTransactionRow } from "@/lib/form4-insider";
import {
  daysAgoIso,
  formatFilingDateLabel,
  formatSharesCompact,
  formatUsdCompact,
  isDateInWindow,
  windowBounds,
} from "@/lib/whats-new/format";
import { pickTeachingKey } from "@/lib/whats-new/teaching-snippets";
import type {
  FeedActivityKind,
  WhatsNewFeed,
  WhatsNewFeedItem,
  WhatsNewFeedSections,
} from "@/lib/whats-new/types";

const FEED_WINDOW_DAYS = 7;
const MIN_NOTABLE_BUY_USD = 25_000;

type CacheRow = {
  ticker: string;
  name: string;
  insider_transactions: InsiderTransactionRow[] | null;
};

type SeedStake = {
  kind: "stake_13d" | "stake_13g";
  ticker: string;
  companyName: string;
  filerName: string;
  ownershipPct: number;
  daysAgo: number;
};

function parseInsiderRows(raw: unknown): InsiderTransactionRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is InsiderTransactionRow =>
      r != null &&
      typeof r === "object" &&
      (r.type === "BUY" || r.type === "SELL") &&
      typeof (r as InsiderTransactionRow).dateIso === "string",
  );
}

function insiderSignificance(row: InsiderTransactionRow): number {
  const value = row.valueUsd ?? 0;
  const shares = row.shares ?? 0;
  return value > 0 ? value : shares * 10;
}

function buildInsiderItem(
  ticker: string,
  companyName: string,
  row: InsiderTransactionRow,
  kind: "insider_buy" | "insider_sell",
): WhatsNewFeedItem {
  const sharesLabel = formatSharesCompact(row.shares);
  const valueLabel = formatUsdCompact(row.valueUsd);
  const parts: string[] = [];
  if (sharesLabel) parts.push(`${sharesLabel} shares`);
  if (valueLabel) parts.push(valueLabel);
  const sizePart = parts.length > 0 ? ` — ${parts.join(", ")}` : "";
  const marketNote = kind === "insider_buy" ? ", open market" : "";

  const who = row.name && row.title ? `${row.name}, ${row.title}` : row.name || row.title;
  const headline =
    kind === "insider_buy"
      ? `${who} bought${sizePart}${marketNote}`
      : `${who} sold${sizePart}`;

  const item: WhatsNewFeedItem = {
    id: `insider-${kind}-${ticker}-${row.dateIso}-${row.name}-${row.type}`,
    kind,
    ticker,
    companyName,
    filingDate: row.dateIso.slice(0, 10),
    filingDateLabel: formatFilingDateLabel(row.dateIso),
    headline,
    subline: row.name,
    significance: insiderSignificance(row),
    teachingSnippetKey: "",
  };
  item.teachingSnippetKey = pickTeachingKey(item);
  return item;
}

async function loadInsiderItemsFromCache(
  start: string,
  end: string,
): Promise<{ buys: WhatsNewFeedItem[]; sells: WhatsNewFeedItem[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const buys: WhatsNewFeedItem[] = [];
  const sells: WhatsNewFeedItem[] = [];

  if (!url || !key) return { buys, sells };

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("stock_data_cache")
    .select("ticker, name, insider_transactions");

  if (error || !data?.length) return { buys, sells };

  for (const row of data as CacheRow[]) {
    const sym = row.ticker.trim().toUpperCase();
    const company = row.name?.trim() || sym;
    for (const tx of parseInsiderRows(row.insider_transactions)) {
      const date = tx.dateIso.slice(0, 10);
      if (!isDateInWindow(date, start, end)) continue;

      if (tx.type === "BUY") {
        const sig = insiderSignificance(tx);
        if (sig < MIN_NOTABLE_BUY_USD && (tx.valueUsd == null || tx.valueUsd === 0)) continue;
        buys.push(buildInsiderItem(sym, company, tx, "insider_buy"));
      } else {
        sells.push(buildInsiderItem(sym, company, tx, "insider_sell"));
      }
    }
  }

  return { buys, sells };
}

function loadSeedStakes(start: string, end: string): { items: WhatsNewFeedItem[]; usedSample: boolean } {
  const filePath = path.join(process.cwd(), "data", "whats-new-stakes.json");
  if (!fs.existsSync(filePath)) return { items: [], usedSample: false };

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as { stakes?: SeedStake[] };
  const items: WhatsNewFeedItem[] = [];

  for (const s of raw.stakes ?? []) {
    const filingDate = daysAgoIso(s.daysAgo);
    if (!isDateInWindow(filingDate, start, end)) continue;

    const kind: FeedActivityKind = s.kind;
    const formLabel = kind === "stake_13d" ? "13D" : "13G";
    const item: WhatsNewFeedItem = {
      id: `stake-${kind}-${s.ticker}-${filingDate}-${s.filerName}`,
      kind,
      ticker: s.ticker.toUpperCase(),
      companyName: s.companyName,
      filingDate,
      filingDateLabel: formatFilingDateLabel(filingDate),
      headline: `${s.filerName} reported ${s.ownershipPct}% stake (${formLabel})`,
      subline: `New large stake · ${formLabel} filing`,
      significance: s.ownershipPct * 2_000_000 + (kind === "stake_13d" ? 500_000 : 0),
      teachingSnippetKey: "",
    };
    item.teachingSnippetKey = pickTeachingKey(item);
    items.push(item);
  }

  return { items, usedSample: items.length > 0 };
}

async function loadInstitutionalItems(start: string, end: string): Promise<WhatsNewFeedItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data: period } = await supabase
    .from("reporting_periods")
    .select("id, label, filing_due")
    .eq("is_latest", true)
    .maybeSingle();

  if (!period?.id) return [];

  const filingDue = period.filing_due?.slice(0, 10);
  const periodInWindow = filingDue ? isDateInWindow(filingDue, start, end) : false;

  let query = supabase
    .from("holdings")
    .select(
      `
      id,
      change_type,
      change_pct,
      portfolio_pct,
      value_usd,
      created_at,
      investor:investors(name, slug),
      security:securities(ticker, name)
    `,
    )
    .eq("period_id", period.id)
    .in("change_type", ["new", "add", "reduce", "sell"]);

  if (periodInWindow && filingDue) {
    query = query.gte("created_at", `${start}T00:00:00Z`);
  } else {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - FEED_WINDOW_DAYS);
    query = query.gte("created_at", cutoff.toISOString());
  }

  const { data, error } = await query.limit(40);
  if (error || !data?.length) return [];

  const items: WhatsNewFeedItem[] = [];

  for (const row of data) {
    const inv = row.investor as { name?: string } | null;
    const sec = row.security as { ticker?: string; name?: string } | null;
    const ticker = sec?.ticker?.toUpperCase();
    if (!ticker) continue;

    const change = row.change_type as string;
    const fund = inv?.name ?? "Tracked fund";
    const pct = row.portfolio_pct != null ? `${Number(row.portfolio_pct).toFixed(1)}% of portfolio` : "";
    const value = formatUsdCompact(Number(row.value_usd));

    let headline = "";
    let subline = "";
    if (change === "new") {
      headline = `${fund} opened a new position`;
      subline = `New 13F position${value ? ` · ${value}` : ""}${pct ? ` · ${pct}` : ""}`;
    } else if (change === "add") {
      headline = `${fund} added to its position`;
      subline = `13F accumulation${row.change_pct != null ? ` · +${Number(row.change_pct).toFixed(0)}% shares` : ""}`;
    } else if (change === "reduce") {
      headline = `${fund} trimmed its position`;
      subline = `13F reduction${row.change_pct != null ? ` · ${Number(row.change_pct).toFixed(0)}% shares` : ""}`;
    } else {
      headline = `${fund} exited the position`;
      subline = "13F full exit";
    }

    const filingDate =
      filingDue && periodInWindow
        ? filingDue
        : (row.created_at as string).slice(0, 10);

    if (!isDateInWindow(filingDate, start, end) && !periodInWindow) {
      const created = (row.created_at as string).slice(0, 10);
      if (!isDateInWindow(created, start, end)) continue;
    }

    const item: WhatsNewFeedItem = {
      id: `inst-${row.id}`,
      kind: "institutional",
      ticker,
      companyName: sec?.name ?? ticker,
      filingDate: periodInWindow && filingDue ? filingDue : (row.created_at as string).slice(0, 10),
      filingDateLabel: formatFilingDateLabel(
        periodInWindow && filingDue ? filingDue : (row.created_at as string).slice(0, 10),
      ),
      headline,
      subline: `${subline} · ${period.label}`,
      significance: Number(row.value_usd) || 100_000,
      teachingSnippetKey: "",
    };
    item.teachingSnippetKey = pickTeachingKey(item);
    items.push(item);
  }

  return items;
}

function pickLeadStory(candidates: WhatsNewFeedItem[]): WhatsNewFeedItem | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (b.significance !== a.significance) return b.significance - a.significance;
    return b.filingDate.localeCompare(a.filingDate);
  });

  const stakes = sorted.filter((i) => i.kind === "stake_13d" || i.kind === "stake_13g");
  const buys = sorted.filter((i) => i.kind === "insider_buy");
  if (stakes.length > 0 && stakes[0].significance >= (buys[0]?.significance ?? 0) * 0.85) {
    return stakes[0];
  }
  if (buys.length > 0) return buys[0];
  return sorted[0];
}

function sortFeedItems(items: WhatsNewFeedItem[]): WhatsNewFeedItem[] {
  return [...items].sort((a, b) => {
    if (b.significance !== a.significance) return b.significance - a.significance;
    return b.filingDate.localeCompare(a.filingDate);
  });
}

function buildSections(all: WhatsNewFeedItem[]): WhatsNewFeedSections {
  return {
    insiderBuys: sortFeedItems(all.filter((i) => i.kind === "insider_buy")),
    insiderSells: sortFeedItems(all.filter((i) => i.kind === "insider_sell")),
    largeStakes: sortFeedItems(all.filter((i) => i.kind === "stake_13d" || i.kind === "stake_13g")),
    institutional: sortFeedItems(all.filter((i) => i.kind === "institutional")),
  };
}

/**
 * Builds the 7-day What's New feed from stock_data_cache (Form 4), holdings (13F), and optional seed stakes.
 * No external API calls — ISR via page revalidate.
 */
export const getWhatsNewFeed = cache(async (): Promise<WhatsNewFeed> => {
  const { start, end } = windowBounds(FEED_WINDOW_DAYS);
  const generatedAt = new Date().toISOString();

  const [{ buys, sells }, { items: stakeItems, usedSample }, institutional] = await Promise.all([
    loadInsiderItemsFromCache(start, end),
    loadSeedStakes(start, end),
    loadInstitutionalItems(start, end),
  ]);

  const all = [...buys, ...sells, ...stakeItems, ...institutional];
  const lead = pickLeadStory(all);
  const leadId = lead?.id;
  const withoutLead = all.filter((i) => i.id !== leadId);

  return {
    windowStart: start,
    windowEnd: end,
    generatedAt,
    lead,
    items: sortFeedItems(withoutLead),
    sections: buildSections(withoutLead),
    usedSampleStakes: usedSample,
  };
});

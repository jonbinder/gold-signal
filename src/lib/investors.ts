import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServiceRole } from "@/lib/supabase/service-role";

export type InvestorPortfolioRow = {
  ticker: string;
  shares: number;
  value: number;
};

export type InvestorImportRow = {
  id: string;
  name: string;
  slug: string;
  photo?: string;
  title?: string;
  description?: string;
  portfolio: InvestorPortfolioRow[];
  lastUpdated?: string;
};

export type SyncInvestorsResult = {
  investorsUpserted: number;
  holdingsUpserted: number;
  skippedTickers: string[];
  periodLabel: string;
};

function getQuarterLabel(date: Date): string {
  const month = date.getUTCMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${date.getUTCFullYear()}`;
}

export async function readInvestorsData(filePath?: string): Promise<InvestorImportRow[]> {
  const resolved = filePath ?? path.join(process.cwd(), "investors-data.json");
  const raw = await readFile(resolved, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("investors-data.json must be a JSON array.");
  }
  return parsed as InvestorImportRow[];
}

export async function syncInvestorsData(filePath?: string): Promise<SyncInvestorsResult> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) {
    throw new Error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const investors = await readInvestorsData(filePath);
  if (investors.length === 0) {
    throw new Error("No investors found in investors-data.json.");
  }

  const latestDate = investors.reduce<Date>((acc, item) => {
    const next = item.lastUpdated ? new Date(item.lastUpdated) : acc;
    return next > acc ? next : acc;
  }, new Date(0));
  const periodLabel = getQuarterLabel(latestDate.getTime() > 0 ? latestDate : new Date());

  const { data: periodRow, error: periodError } = await supabase
    .from("reporting_periods")
    .upsert(
      {
        label: periodLabel,
        period_end: latestDate.getTime() > 0 ? latestDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        is_latest: true,
      },
      { onConflict: "label" },
    )
    .select("id,label")
    .single();

  if (periodError || !periodRow) {
    throw new Error(`Failed to upsert reporting period: ${periodError?.message ?? "unknown error"}`);
  }

  const investorPayload = investors.map((inv) => ({
    slug: inv.slug,
    name: inv.name,
    firm: inv.title ?? null,
    bio: inv.description ?? null,
    logo_url: inv.photo ? `/${inv.photo.replace(/^\/+/, "")}` : null,
    is_active: true,
  }));

  const { data: upsertedInvestors, error: investorError } = await supabase
    .from("investors")
    .upsert(investorPayload, { onConflict: "slug" })
    .select("id,slug");

  if (investorError) {
    throw new Error(`Failed to upsert investors: ${investorError.message}`);
  }

  const investorIdBySlug = new Map((upsertedInvestors ?? []).map((r) => [r.slug, r.id]));
  const allTickers = Array.from(new Set(investors.flatMap((i) => i.portfolio.map((p) => p.ticker.toUpperCase()))));

  const { data: securities, error: securitiesError } = await supabase
    .from("securities")
    .select("id,ticker")
    .in("ticker", allTickers);

  if (securitiesError) {
    throw new Error(`Failed to load securities: ${securitiesError.message}`);
  }

  const securityIdByTicker = new Map((securities ?? []).map((s) => [s.ticker.toUpperCase(), s.id]));
  const skippedTickers = new Set<string>();

  const holdingsPayload: Array<{
    investor_id: string;
    security_id: string;
    period_id: string;
    shares: number;
    value_usd: number;
    change_type: "unchanged";
  }> = [];

  for (const inv of investors) {
    const investorId = investorIdBySlug.get(inv.slug);
    if (!investorId) continue;
    for (const row of inv.portfolio) {
      const ticker = row.ticker.toUpperCase();
      const securityId = securityIdByTicker.get(ticker);
      if (!securityId) {
        skippedTickers.add(ticker);
        continue;
      }
      holdingsPayload.push({
        investor_id: investorId,
        security_id: securityId,
        period_id: periodRow.id,
        shares: Math.trunc(row.shares),
        value_usd: Math.trunc(row.value),
        change_type: "unchanged",
      });
    }
  }

  if (holdingsPayload.length > 0) {
    const { error: holdingsError } = await supabase
      .from("holdings")
      .upsert(holdingsPayload, { onConflict: "investor_id,security_id,period_id" });
    if (holdingsError) {
      throw new Error(`Failed to upsert holdings: ${holdingsError.message}`);
    }
  }

  return {
    investorsUpserted: upsertedInvestors?.length ?? 0,
    holdingsUpserted: holdingsPayload.length,
    skippedTickers: Array.from(skippedTickers).sort(),
    periodLabel: periodRow.label,
  };
}

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseServiceRole } from "@/lib/supabase/service-role";

/**
 * Investor system source of truth:
 * - Edit investors-data.json in the project root.
 * - Put photos in public/investors/ named with the same slug (e.g. eric-sprott.jpg).
 * - Run `npm run sync:investors` to upsert investors + holdings into Supabase.
 */

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

export type InvestorViewModel = {
  id: string;
  slug: string;
  name: string;
  imageSrc: string;
  title: string;
  description: string;
  lastUpdated: string | null;
  portfolio: InvestorPortfolioRow[];
};

export type SyncInvestorsResult = {
  investorsUpserted: number;
  holdingsUpserted: number;
  skippedTickers: string[];
  periodLabel: string;
};

const INVESTOR_PHOTO_PLACEHOLDER = "/investors/placeholder-investor.svg";
const photoExistsCache = new Map<string, boolean>();
let publicInvestorsFilesCache: Map<string, string> | null = null;

function getQuarterLabel(date: Date): string {
  const month = date.getUTCMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${date.getUTCFullYear()}`;
}

function stripJsonComments(content: string): string {
  // Supports `// ...` and `/* ... */` comments in investors-data.json.
  return content
    .replace(/^\uFEFF/, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function validateInvestorsData(rows: InvestorImportRow[]) {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const idx = i + 1;
    if (!row.slug?.trim()) throw new Error(`Invalid investors-data.json: row ${idx} is missing slug.`);
    if (!row.name?.trim()) throw new Error(`Invalid investors-data.json: row ${idx} (${row.slug}) is missing name.`);
    if (seen.has(row.slug)) throw new Error(`Invalid investors-data.json: duplicate slug "${row.slug}".`);
    seen.add(row.slug);
    if (!Array.isArray(row.portfolio)) {
      throw new Error(`Invalid investors-data.json: row ${idx} (${row.slug}) portfolio must be an array.`);
    }
  });
}

export async function readInvestorsData(filePath?: string): Promise<InvestorImportRow[]> {
  const resolved = filePath ?? path.join(process.cwd(), "investors-data.json");
  const raw = await readFile(resolved, "utf8");
  const parsed = JSON.parse(stripJsonComments(raw)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("investors-data.json must be a JSON array.");
  }
  const rows = parsed as InvestorImportRow[];
  validateInvestorsData(rows);
  return rows;
}

async function resolveInvestorPhotoSrc(slug: string, photo?: string): Promise<string> {
  // Maintainers: place investor photos under public/investors/.
  // Naming convention: use the investor slug, e.g. public/investors/eric-sprott.jpg
  const publicInvestorsDir = path.join(process.cwd(), "public", "investors");
  const requested = (photo ?? `/investors/${slug}.jpg`).replace(/^\/+/, "");
  const requestedName = path.basename(requested);
  const expectedName = `${slug}.jpg`;

  // Prefer explicit JSON path, then canonical /investors/[slug].jpg.
  const candidates = [requestedName, expectedName];

  if (!publicInvestorsFilesCache) {
    const files = await readdir(publicInvestorsDir).catch(() => []);
    publicInvestorsFilesCache = new Map(files.map((f) => [f.toLowerCase(), f]));
  }

  for (const candidate of candidates) {
    const fromDir = publicInvestorsFilesCache.get(candidate.toLowerCase());
    if (!fromDir) continue;
    const relative = `investors/${fromDir}`;
    const absolute = path.join(process.cwd(), "public", relative);
    if (!photoExistsCache.has(absolute)) {
      try {
        await access(absolute);
        photoExistsCache.set(absolute, true);
      } catch {
        photoExistsCache.set(absolute, false);
      }
    }
    if (photoExistsCache.get(absolute)) return `/${relative}`;
  }

  // Backward compatibility for older files such as public/investors/eric.jpg.
  const legacyFirstName = slug.split("-")[0];
  const legacyRelative = `investors/${legacyFirstName}.jpg`;
  const legacyAbsolute = path.join(process.cwd(), "public", legacyRelative);

  if (!photoExistsCache.has(legacyAbsolute)) {
    try {
      await access(legacyAbsolute);
      photoExistsCache.set(legacyAbsolute, true);
    } catch {
      photoExistsCache.set(legacyAbsolute, false);
    }
  }

  return photoExistsCache.get(legacyAbsolute) ? `/${legacyRelative}` : INVESTOR_PHOTO_PLACEHOLDER;
}

export async function getInvestors(filePath?: string): Promise<InvestorViewModel[]> {
  const rows = await readInvestorsData(filePath);
  const resolvedRows = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      imageSrc: await resolveInvestorPhotoSrc(row.slug, row.photo),
      title: row.title ?? "Precious Metals Investor",
      description: row.description ?? "",
      lastUpdated: row.lastUpdated ?? null,
      portfolio: row.portfolio ?? [],
    })),
  );

  return resolvedRows;
}

export async function getInvestorBySlug(slug: string, filePath?: string): Promise<InvestorViewModel | null> {
  const investors = await getInvestors(filePath);
  return investors.find((inv) => inv.slug === slug) ?? null;
}

export async function syncInvestorsToSupabase(filePath?: string): Promise<SyncInvestorsResult> {
  // Quarterly workflow:
  // 1) Update investors-data.json portfolio rows.
  // 2) Ensure corresponding ticker symbols exist in securities table.
  // 3) Run `npm run sync:investors`.
  const supabase = getSupabaseServiceRole();
  if (!supabase) {
    throw new Error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const investors = await readInvestorsData(filePath);
  publicInvestorsFilesCache = null;
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
    logo_url: inv.photo ? (inv.photo.startsWith("/") ? inv.photo : `/${inv.photo}`) : `/investors/${inv.slug}.jpg`,
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

// Backwards-compatible alias
export const syncInvestorsData = syncInvestorsToSupabase;

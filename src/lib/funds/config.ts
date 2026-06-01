import { readFile } from "node:fs/promises";
import path from "node:path";

export type TrackedFundConfig = {
  cik: string;
  display_name: string;
  slug: string;
  manager_name: string | null;
  focus_note: string;
  website: string | null;
};

let cachedFunds: TrackedFundConfig[] | null = null;

export function getFundsConfigPath(): string {
  return path.join(process.cwd(), "data", "funds.json");
}

export async function readFundsConfig(filePath?: string): Promise<TrackedFundConfig[]> {
  if (!filePath && cachedFunds) return cachedFunds;
  const resolved = filePath ?? getFundsConfigPath();
  const raw = await readFile(resolved, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("data/funds.json must be a JSON array.");
  }

  const rows: TrackedFundConfig[] = [];
  const seenSlugs = new Set<string>();
  const seenCiks = new Set<string>();

  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i] as Record<string, unknown>;
    const idx = i + 1;
    const cik = String(row.cik ?? "").replace(/\D/g, "");
    const slug = String(row.slug ?? "").trim();
    const display_name = String(row.display_name ?? "").trim();
    if (!cik) throw new Error(`data/funds.json row ${idx}: missing cik.`);
    if (!slug) throw new Error(`data/funds.json row ${idx}: missing slug.`);
    if (!display_name) throw new Error(`data/funds.json row ${idx}: missing display_name.`);
    if (seenSlugs.has(slug)) throw new Error(`data/funds.json: duplicate slug "${slug}".`);
    if (seenCiks.has(cik)) throw new Error(`data/funds.json: duplicate cik "${cik}".`);
    seenSlugs.add(slug);
    seenCiks.add(cik);

    rows.push({
      cik: cik.padStart(10, "0"),
      display_name,
      slug,
      manager_name: row.manager_name != null ? String(row.manager_name).trim() || null : null,
      focus_note: String(row.focus_note ?? "").trim(),
      website: row.website != null ? String(row.website).trim() || null : null,
    });
  }

  if (!filePath) cachedFunds = rows;
  return rows;
}

export async function getTrackedFundSlugs(): Promise<Set<string>> {
  const funds = await readFundsConfig();
  return new Set(funds.map((f) => f.slug));
}

export async function getFundConfigBySlug(slug: string): Promise<TrackedFundConfig | null> {
  const funds = await readFundsConfig();
  return funds.find((f) => f.slug === slug) ?? null;
}

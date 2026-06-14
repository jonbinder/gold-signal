import fs from "fs";
import path from "path";
import {
  isTrackedInvestorSlug,
  normalizeTrackedInvestorSlug,
} from "../src/lib/investors/tracked-roster";

const jsonPath = path.join(process.cwd(), "public", "data", "investors.json");
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
  updatedAt: string;
  investors: Array<{ slug: string; name: string }>;
};

const bySlug = new Map<string, (typeof raw.investors)[number]>();
for (const inv of raw.investors) {
  const slug = normalizeTrackedInvestorSlug(inv.slug);
  if (!isTrackedInvestorSlug(slug)) continue;
  bySlug.set(slug, { ...inv, slug });
}

const payload = {
  updatedAt: new Date().toISOString(),
  investors: [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name)),
};

fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Kept ${payload.investors.length} investors`);

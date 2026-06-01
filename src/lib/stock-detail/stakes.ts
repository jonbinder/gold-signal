import fs from "fs";
import path from "path";
import { formatFilingDateLabel, daysAgoIso } from "@/lib/whats-new/format";
import type { LargeStakeRow } from "@/lib/stock-detail/types";

type SeedStake = {
  kind: "stake_13d" | "stake_13g";
  ticker: string;
  filerName: string;
  ownershipPct: number;
  daysAgo: number;
};

export function loadLargeStakesForTicker(ticker: string): LargeStakeRow[] {
  const sym = ticker.trim().toUpperCase();
  const filePath = path.join(process.cwd(), "data", "whats-new-stakes.json");
  if (!fs.existsSync(filePath)) return [];

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as { stakes?: SeedStake[] };
  const out: LargeStakeRow[] = [];

  for (const s of raw.stakes ?? []) {
    if (s.ticker.toUpperCase() !== sym) continue;
    const filingDate = daysAgoIso(s.daysAgo);
    out.push({
      kind: s.kind,
      filerName: s.filerName,
      ownershipPct: s.ownershipPct,
      filingDate,
      filingDateLabel: formatFilingDateLabel(filingDate),
    });
  }

  out.sort((a, b) => b.filingDate.localeCompare(a.filingDate));
  return out;
}

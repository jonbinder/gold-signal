import fs from "fs";
import path from "path";
import { cache } from "react";
import type { TrackedStock, TrackedStocksFile } from "@/lib/tracked-stocks";

export function loadTrackedStocksSync(): TrackedStock[] {
  const filePath = path.join(process.cwd(), "data", "tracked-stocks.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as TrackedStocksFile;
  return parsed.stocks ?? [];
}

export const getTrackedStocks = cache(async (): Promise<TrackedStock[]> => {
  return loadTrackedStocksSync();
});

export async function isTickerInUniverse(ticker: string): Promise<boolean> {
  const sym = ticker.trim().toUpperCase();
  const stocks = await getTrackedStocks();
  return stocks.some((s) => s.ticker === sym);
}

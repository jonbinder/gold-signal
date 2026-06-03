/**
 * Download Polygon branding images into public/stock-logos/ and write manifest.
 * Run: npx tsx scripts/download-stock-logos.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import {
  appendPolygonApiKey,
  extractPolygonBranding,
  pickPolygonBrandingImageUrl,
} from "../src/lib/stock-branding";
import { getTickerDetails, normalizeTicker } from "../src/lib/polygon";
import { loadTrackedStocksFile } from "../src/lib/stock-universe-refresh";

const OUT_DIR = path.join(process.cwd(), "public", "stock-logos");
const MANIFEST_PATH = path.join(process.cwd(), "data", "stock-logos-manifest.json");

async function main() {
  const polygonKey = process.env.POLYGON_API_KEY?.trim();
  if (!polygonKey) {
    console.error("POLYGON_API_KEY missing");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest: Record<string, string> = {};
  const stocks = loadTrackedStocksFile();

  let saved = 0;
  let skipped = 0;

  for (const stock of stocks) {
    const ticker = normalizeTicker(stock.ticker);
    if (!ticker) continue;

    const details = await getTickerDetails(ticker);
    const branding = details.ok ? extractPolygonBranding(details.data.raw) : null;
    if (!branding) {
      skipped += 1;
      console.log(`[${ticker}] no branding`);
      continue;
    }

    const candidates = [branding.icon_url, branding.logo_url].filter(
      (u): u is string => typeof u === "string" && u.trim().length > 0,
    );

    let sourceUrl: string | null = null;
    let res: Response | null = null;
    for (const candidate of candidates) {
      const attempt = await fetch(appendPolygonApiKey(candidate.trim(), polygonKey));
      if (attempt.ok) {
        sourceUrl = candidate.trim();
        res = attempt;
        break;
      }
    }

    if (!res || !sourceUrl) {
      skipped += 1;
      console.warn(`[${ticker}] image fetch failed for all branding URLs`);
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const ext = sourceUrl.toLowerCase().includes(".svg") ? "svg" : "png";
    const filename = `${ticker}.${ext}`;
    fs.writeFileSync(path.join(OUT_DIR, filename), buf);
    manifest[ticker] = `/stock-logos/${filename}`;
    saved += 1;
    console.log(`[${ticker}] saved -> ${manifest[ticker]}`);
    await new Promise((r) => setTimeout(r, 250));
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nSaved ${saved} logos, ${skipped} skipped. Manifest: data/stock-logos-manifest.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

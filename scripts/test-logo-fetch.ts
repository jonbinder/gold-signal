import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { appendPolygonApiKey, extractPolygonBranding, pickPolygonBrandingImageUrl } from "../src/lib/stock-branding";
import { getTickerDetails } from "../src/lib/polygon";

async function test(ticker: string) {
  const key = process.env.POLYGON_API_KEY!.trim();
  const d = await getTickerDetails(ticker);
  const url = d.ok ? pickPolygonBrandingImageUrl(extractPolygonBranding(d.data.raw)) : null;
  console.log(ticker, "branding url", url);
  if (!url) return;
  for (const label of ["icon", "logo"]) {
    const branding = extractPolygonBranding(d.data.raw);
    const u = label === "icon" ? branding?.icon_url : branding?.logo_url;
    if (!u) continue;
    const res = await fetch(appendPolygonApiKey(u, key));
    console.log(" ", label, res.status, res.headers.get("content-type"));
  }
}

async function main() {
  await test("WPM");
  await test("FNV");
  await test("RGLD");
}

main();

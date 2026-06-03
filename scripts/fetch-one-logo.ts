import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { appendPolygonApiKey, extractPolygonBranding } from "../src/lib/stock-branding";
import { getTickerDetails, normalizeTicker } from "../src/lib/polygon";

async function main() {
  const ticker = normalizeTicker(process.argv[2] ?? "FNV");
  const polygonKey = process.env.POLYGON_API_KEY?.trim();
  if (!polygonKey) throw new Error("POLYGON_API_KEY missing");

  const details = await getTickerDetails(ticker);
  const branding = details.ok ? extractPolygonBranding(details.data.raw) : null;
  const icon = branding?.icon_url?.trim();
  if (!icon) {
    console.error("No branding for", ticker);
    process.exit(1);
  }

  const res = await fetch(appendPolygonApiKey(icon, polygonKey));
  console.log("fetch", res.status, res.headers.get("content-type"));
  if (!res.ok) process.exit(1);

  const buf = Buffer.from(await res.arrayBuffer());
  const out = path.join("public", "stock-logos", `${ticker}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);

  const manifestPath = path.join("data", "stock-logos-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, string>;
  manifest[ticker] = `/stock-logos/${ticker}.png`;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("saved", manifest[ticker]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractPolygonBranding, pickPolygonBrandingImageUrl } from "../src/lib/stock-branding";
import { getTickerDetails } from "../src/lib/polygon";

async function main() {
  for (const t of ["WPM", "FNV", "RGLD", "TFPM", "OR", "AEM"]) {
    const r = await getTickerDetails(t);
    const url = r.ok ? pickPolygonBrandingImageUrl(extractPolygonBranding(r.data.raw)) : null;
    console.log(t, "ok=", r.ok, "url=", url, r.ok ? "" : `err=${(r as { error?: string }).error}`);
  }
}

main();

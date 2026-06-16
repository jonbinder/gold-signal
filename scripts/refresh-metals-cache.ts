import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { refreshMetalsMarketCache } from "@/lib/metals-market-refresh";

async function main() {
  const result = await refreshMetalsMarketCache();
  if (!result.ok) {
    console.error("Metals cache refresh failed:", result.error);
    process.exit(1);
  }
  console.log("Metals cache refreshed (spot gold/silver).");
}

main();

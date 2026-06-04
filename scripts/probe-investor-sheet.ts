import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readInvestorPositionsSheet, readSheetEnvConfig } from "../src/lib/google-sheets/read-positions-tab";

async function main() {
  const config = readSheetEnvConfig();
  if (!config) {
    console.log("env missing");
    process.exit(1);
  }
  console.log("tab:", config.tabName);
  console.log("spreadsheetId:", config.spreadsheetId.slice(0, 8) + "...");
  const rows = await readInvestorPositionsSheet(config);
  console.log("rowsRead:", rows.length);
  if (rows[0]) {
    console.log("header cells:", rows[0].map((c, i) => `[${i}]=${JSON.stringify(c)}`).join("\n  "));
    console.log("normalized:", rows[0].map((c) => c?.trim().toLowerCase()));
  }
  for (let i = 1; i < rows.length; i++) {
    console.log(`row${i + 1}:`, rows[i]);
  }
}

main().catch(console.error);

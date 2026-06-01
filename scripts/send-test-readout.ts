/**
 * Send a test filing readout email locally.
 *
 * Usage:
 *   npx tsx scripts/send-test-readout.ts you@email.com "WPM,ABRA,FAKE99"
 *
 * Requires RESEND_API_KEY in .env.local (and verified sender domain).
 */
import "dotenv/config";
import { collectReadoutForTickers } from "../src/lib/email/readout/collect-ticker-readout";
import { sendReadoutEmail } from "../src/lib/email/send-readout-email";
import { parseTickerInput, sanitizeTickers } from "../src/lib/portfolio-submission";

async function main() {
  const to = process.argv[2];
  const tickersRaw = process.argv[3] ?? "WPM,ABRA,NOTREAL";

  if (!to?.includes("@")) {
    console.error("Usage: npx tsx scripts/send-test-readout.ts <email> [tickers]");
    process.exit(1);
  }

  const tickers = sanitizeTickers(parseTickerInput(tickersRaw));
  const { readouts } = await collectReadoutForTickers(tickers);

  console.log("Readouts built:", readouts.map((r) => `${r.ticker} onFile=${r.onFile}`).join(", "));

  const { emailId } = await sendReadoutEmail({
    to,
    userName: "Test User",
    tickers: readouts,
    skippedInvalidTickers: [],
  });

  console.log("Sent readout email:", emailId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

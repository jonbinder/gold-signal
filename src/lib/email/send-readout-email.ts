import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import { ReadoutEmail } from "@/lib/email/readoutEmail";
import type { ReadoutEmailPayload } from "@/lib/email/readout/types";

const FROM_ADDRESS = "reports@goldsignal.ai";

export type SendReadoutEmailParams = ReadoutEmailPayload & {
  to: string;
};

export function getSubstackUrl(): string {
  return (
    process.env.SUBSTACK_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUBSTACK_URL?.trim() ||
    "https://goldsignal.substack.com"
  );
}

/**
 * Sends the per-ticker filing readout via Resend.
 */
export async function sendReadoutEmail(params: SendReadoutEmailParams): Promise<{ emailId: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (params.tickers.length === 0) {
    throw new Error("Cannot send readout email with zero tickers.");
  }

  const resend = new Resend(apiKey);
  const html = await render(
    createElement(ReadoutEmail, {
      userName: params.userName,
      tickers: params.tickers,
      skippedInvalidTickers: params.skippedInvalidTickers,
      substackUrl: getSubstackUrl(),
    }),
  );

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: "Your GoldSignal filing readout",
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }

  const emailId = data?.id ?? "unknown";
  console.info("[email] Readout sent", { emailId, tickerCount: params.tickers.length });
  return { emailId };
}

/** Re-export for scripts and future digests. */
export { collectStoredTickerReadout, collectReadoutForTickers } from "@/lib/email/readout/collect-ticker-readout";
export type { TickerReadout, ReadoutEmailPayload } from "@/lib/email/readout/types";

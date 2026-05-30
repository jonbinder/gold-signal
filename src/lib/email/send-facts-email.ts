import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import { FactsReadyEmail } from "@/lib/email/factsReadyEmail";
import type { PortfolioTickerFacts } from "@/lib/portfolio-facts";

const FROM_ADDRESS = "reports@goldsignal.ai";

export type SendFactsEmailParams = {
  to: string;
  userName: string;
  tickers: PortfolioTickerFacts[];
};

/**
 * Sends the portfolio facts summary via Resend (no PDF attachment).
 */
export async function sendFactsEmail(params: SendFactsEmailParams): Promise<{ emailId: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);
  const html = await render(
    createElement(FactsReadyEmail, {
      userName: params.userName,
      tickers: params.tickers,
    }),
  );

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: "Your GoldSignal Portfolio Facts Summary",
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }

  const emailId = data?.id ?? "unknown";
  console.info("[email] Facts summary sent", { emailId });
  return { emailId };
}

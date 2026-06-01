import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import { ReportReadyEmail } from "@/lib/email/reportReadyEmail";
import { topPickAndWatchOut } from "@/lib/pdf/report-copy";
import type { StockRankingResult } from "@/lib/ranking";

const FROM_ADDRESS = "reports@goldsignal.ai";

export type SendReportEmailParams = {
  to: string;
  userName: string;
  portfolioGrade: string;
  portfolioScore: number;
  rankings: StockRankingResult[];
  pdfBuffer: Buffer;
  downloadUrl: string;
};

/**
 * DORMANT — Sends the SignalScore PDF report via Resend. Public flow uses send-facts-email instead.
 */
export async function sendReportEmail(
  params: SendReportEmailParams,
): Promise<{ emailId: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);
  const { top, bottom } = topPickAndWatchOut(params.rankings);

  const emailProps = {
    userName: params.userName,
    stockCount: params.rankings.length,
    portfolioGrade: params.portfolioGrade,
    portfolioScore: params.portfolioScore,
    topTicker: top?.ticker ?? "—",
    topScore: top?.score ?? 0,
    bottomTicker: bottom?.ticker ?? "—",
    bottomScore: bottom?.score ?? 0,
    downloadUrl: params.downloadUrl,
  };

  let html: string;
  try {
    html = await render(createElement(ReportReadyEmail, emailProps));
  } catch (err) {
    console.error("[email] React render failed:", {
      errorName: err instanceof Error ? err.name : "unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: "Your SignalScore Report is Ready",
      html,
      attachments: [
        {
          filename: "signalscore-report.pdf",
          content: params.pdfBuffer,
        },
      ],
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }

    const emailId = data?.id ?? "unknown";
    console.info("[email] Sent", { emailId });
    return { emailId };
  } catch (err) {
    console.error("[email] Resend send failed:", {
      errorName: err instanceof Error ? err.name : "unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: apiKey.slice(0, 6),
      from: FROM_ADDRESS,
      toIsString: typeof params.to === "string",
      pdfBufferType: typeof params.pdfBuffer,
      pdfBufferIsBuffer: Buffer.isBuffer(params.pdfBuffer),
      htmlLength: html.length,
    });
    throw err;
  }
}

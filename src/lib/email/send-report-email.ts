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
 * Sends the SignalScore PDF report via Resend with attachment and backup link.
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

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: "Your SignalScore Report is Ready",
    react: ReportReadyEmail({
      userName: params.userName,
      stockCount: params.rankings.length,
      portfolioGrade: params.portfolioGrade,
      portfolioScore: params.portfolioScore,
      topTicker: top?.ticker ?? "—",
      topScore: top?.score ?? 0,
      bottomTicker: bottom?.ticker ?? "—",
      bottomScore: bottom?.score ?? 0,
      downloadUrl: params.downloadUrl,
    }),
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
  console.info("[email] Report sent", { submissionEmailHash: "redacted", emailId });
  return { emailId };
}

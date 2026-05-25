import * as React from "react";

export type ReportReadyEmailProps = {
  userName: string;
  stockCount: number;
  portfolioGrade: string;
  portfolioScore: number;
  topTicker: string;
  topScore: number;
  bottomTicker: string;
  bottomScore: number;
  downloadUrl: string;
};

/**
 * HTML email body for the SignalScore report ready notification.
 */
export function ReportReadyEmail({
  userName,
  stockCount,
  portfolioGrade,
  portfolioScore,
  topTicker,
  topScore,
  bottomTicker,
  bottomScore,
  downloadUrl,
}: ReportReadyEmailProps) {
  return (
    <html>
      <body style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#111009", lineHeight: 1.6 }}>
        <p>Hi {userName},</p>
        <p>
          Your portfolio of <strong>{stockCount}</strong> stocks has been analyzed across our seven
          proprietary signals. See the attached PDF for the full breakdown.
        </p>
        <p
          style={{
            background: "#FBF3DC",
            padding: "16px 20px",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          Portfolio grade: {portfolioGrade} · SignalScore {portfolioScore}
        </p>
        <p>
          Your top-ranked holding is <strong>{topTicker}</strong> with a SignalScore of {topScore}.
          Your lowest-ranked holding is <strong>{bottomTicker}</strong> at {bottomScore}.
        </p>
        <p>
          <a href={downloadUrl} style={{ color: "#C9971C" }}>
            Download your report (link expires in 30 days)
          </a>
        </p>
        <p>
          If you have questions or want deeper analysis on any of these stocks, just reply to this
          email.
        </p>
        <p>
          — The GoldSignal Team
        </p>
        <hr style={{ border: "none", borderTop: "1px solid #E8E2D6", margin: "24px 0" }} />
        <p style={{ fontSize: "12px", color: "#5C5649" }}>
          Methodology:{" "}
          <a href="https://goldsignal.ai/signalscore" style={{ color: "#C9971C" }}>
            goldsignal.ai/signalscore
          </a>
        </p>
        <p style={{ fontSize: "12px", color: "#5C5649" }}>
          Disclaimer: This report is for informational purposes only and does not constitute
          investment advice. Consult a qualified financial advisor before making investment
          decisions.
        </p>
      </body>
    </html>
  );
}

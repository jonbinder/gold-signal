import * as React from "react";
import type { PortfolioTickerFacts } from "@/lib/portfolio-facts";
import { formatAsOfDate, formatInsiderNetLabel } from "@/lib/stock-facts-format";

export type FactsReadyEmailProps = {
  userName: string;
  tickers: PortfolioTickerFacts[];
};

function fmtUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * HTML email body for the portfolio facts summary.
 */
export function FactsReadyEmail({ userName, tickers }: FactsReadyEmailProps) {
  return (
    <html>
      <body style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#111009", lineHeight: 1.6 }}>
        <p>Hi {userName},</p>
        <p>
          Here is a facts summary for your <strong>{tickers.length}</strong> holding
          {tickers.length === 1 ? "" : "s"} — tracked investor ownership and recent insider activity
          from public SEC filings.
        </p>

        {tickers.map((t) => {
          const net = formatInsiderNetLabel(t.insiderNet90dUsd);
          const asOf = formatAsOfDate(t.insiderAsOf);
          return (
            <div
              key={t.ticker}
              style={{
                marginBottom: "24px",
                padding: "16px 20px",
                border: "1px solid #E8E2D6",
                borderRadius: "8px",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                {t.companyName} ({t.ticker})
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#5C5649" }}>
                Market cap: {t.marketCap}
                {t.ceo ? ` · CEO: ${t.ceo}` : ""}
              </p>

              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Tracked investors</p>
              {t.famousHolderCount === 0 ? (
                <p style={{ margin: "0 0 12px", fontSize: "14px" }}>None on file.</p>
              ) : (
                <ul style={{ margin: "0 0 12px", paddingLeft: "20px", fontSize: "14px" }}>
                  {t.famousHolders.map((h) => (
                    <li key={h.slug}>{h.name}</li>
                  ))}
                </ul>
              )}

              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Insider activity (90 days)</p>
              <p style={{ margin: "0 0 12px", fontSize: "14px" }}>
                {net.text}
                {asOf ? ` · As of ${asOf}` : ""}
              </p>

              {t.insiderRows.length === 0 ? (
                <p style={{ margin: 0, fontSize: "14px" }}>No recent Form 4 transactions on file.</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: "14px" }}>
                    Recent transactions
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                    {t.insiderRows.slice(0, 8).map((r, i) => (
                      <li key={`${r.dateIso}-${i}`}>
                        {r.type} — {r.name} ({r.title}) — {fmtUsd(r.valueUsd)} — {r.date}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p style={{ margin: "12px 0 0", fontSize: "13px" }}>
                <a href={`https://goldsignal.ai/stocks/${t.ticker}`} style={{ color: "#C9971C" }}>
                  View full stock page →
                </a>
              </p>
            </div>
          );
        })}

        <p>
          If you have questions, reply to this email.
        </p>
        <p>— The GoldSignal Team</p>
        <hr style={{ border: "none", borderTop: "1px solid #E8E2D6", margin: "24px 0" }} />
        <p style={{ fontSize: "12px", color: "#5C5649" }}>
          Methodology:{" "}
          <a href="https://goldsignal.ai/signalscore" style={{ color: "#C9971C" }}>
            goldsignal.ai/signalscore
          </a>
        </p>
        <p style={{ fontSize: "12px", color: "#5C5649" }}>
          Disclaimer: For informational purposes only. Not investment advice.
        </p>
      </body>
    </html>
  );
}

import * as React from "react";
import type { ReadoutEmailPayload, TickerReadout } from "@/lib/email/readout/types";
import { getTeachingSnippet } from "@/lib/whats-new/teaching-snippets";

export type ReadoutEmailProps = ReadoutEmailPayload & {
  substackUrl: string;
};

function fmtUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtShares(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

const box: React.CSSProperties = {
  marginBottom: "28px",
  padding: "18px 20px",
  border: "1px solid #E8E2D6",
  borderRadius: "8px",
  background: "#FFFCF7",
};

const teaching: React.CSSProperties = {
  marginTop: "12px",
  padding: "10px 12px",
  background: "#F5EFE4",
  borderLeft: "3px solid #C9971C",
  fontSize: "13px",
  lineHeight: 1.5,
  color: "#3D3830",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#111009",
};

function TickerBlock({ readout }: { readout: TickerReadout }) {
  if (!readout.onFile) {
    return (
      <div style={box}>
        <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
          {readout.ticker}
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "#5C5649" }}>
          We don&apos;t have recent filing activity on file for <strong>{readout.ticker}</strong> yet.
          It may be outside our tracked gold &amp; silver universe.
        </p>
      </div>
    );
  }

  return (
    <div style={box}>
      <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>
        {readout.companyName}{" "}
        <span style={{ color: "#A67D24", fontFamily: "monospace" }}>({readout.ticker})</span>
      </h2>
      {readout.marketCap ? (
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#5C5649" }}>
          Market cap: {readout.marketCap}
        </p>
      ) : null}

      <p style={sectionTitle}>Recent insider activity (Form 4)</p>
      {readout.insider.transactions.length === 0 ? (
        <p style={{ margin: "0 0 8px", fontSize: "14px" }}>No recent insider transactions on file.</p>
      ) : (
        <>
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            90-day net: <strong>{readout.insider.net90dLabel}</strong>
            {readout.insider.asOfLabel ? ` · As of ${readout.insider.asOfLabel}` : null}
          </p>
          <ul style={{ margin: "0 0 8px", paddingLeft: "20px", fontSize: "13px" }}>
            {readout.insider.transactions.map((r, i) => (
              <li key={`${r.dateIso}-${i}`} style={{ marginBottom: "4px" }}>
                <strong>{r.type}</strong> — {r.name} ({r.title}) — {fmtShares(r.shares)} shares,{" "}
                {fmtUsd(r.valueUsd)} — {r.date}
              </li>
            ))}
          </ul>
        </>
      )}
      <div style={teaching}>
        <strong>Why this matters:</strong> {getTeachingSnippet(readout.insider.teachingKey)}
      </div>

      <p style={{ ...sectionTitle, marginTop: "20px" }}>Institutional ownership (13F)</p>
      {!readout.institutional.available || readout.institutional.holderCount === 0 ? (
        <p style={{ margin: "0 0 8px", fontSize: "14px" }}>No institutional data on file.</p>
      ) : (
        <>
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            <strong>{readout.institutional.holderCount}</strong> tracked fund
            {readout.institutional.holderCount === 1 ? "" : "s"} reported holding this name
            {readout.institutional.periodLabel
              ? ` as of ${readout.institutional.periodLabel} (last filed quarter)`
              : " (last filed quarter)"}
            .
            {readout.institutional.netChangeSummary
              ? ` Quarter-over-quarter: ${readout.institutional.netChangeSummary}.`
              : null}
          </p>
          {readout.institutional.fundNames.length > 0 ? (
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#5C5649" }}>
              Including: {readout.institutional.fundNames.join(", ")}
              {readout.institutional.fundNames.length >= 8 ? "…" : ""}
            </p>
          ) : null}
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#5C5649", fontStyle: "italic" }}>
            13F data reflects quarter-end positions filed ~45 days after period close — not
            necessarily today&apos;s book.
          </p>
        </>
      )}
      <div style={teaching}>
        <strong>Why this matters:</strong> {getTeachingSnippet(readout.institutional.teachingKey)}
      </div>

      {readout.largeStakes.length > 0 ? (
        <>
          <p style={{ ...sectionTitle, marginTop: "20px" }}>Large stakes (13D / 13G)</p>
          <ul style={{ margin: "0 0 8px", paddingLeft: "20px", fontSize: "13px" }}>
            {readout.largeStakes.map((s, i) => (
              <li key={`${s.filerName}-${i}`}>
                {s.filerName} — {s.ownershipPct}% ({s.kind === "stake_13d" ? "13D" : "13G"}) — filed{" "}
                {s.filingDateLabel}
              </li>
            ))}
          </ul>
          <div style={teaching}>
            <strong>Why this matters:</strong>{" "}
            {getTeachingSnippet(
              readout.largeStakes[0]?.kind === "stake_13d" ? "stake_13d_default" : "stake_13g_default",
            )}
          </div>
        </>
      ) : null}

      <p style={{ margin: "16px 0 0", fontSize: "13px" }}>
        <a href={readout.stockPageUrl} style={{ color: "#C9971C", fontWeight: 600 }}>
          View full stock page on GoldSignal →
        </a>
      </p>
    </div>
  );
}

/**
 * HTML email for the per-ticker filing readout lead magnet.
 */
export function ReadoutEmail({ userName, tickers, skippedInvalidTickers, substackUrl }: ReadoutEmailProps) {
  return (
    <html>
      <body style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#111009", lineHeight: 1.6 }}>
        <p>Hi {userName},</p>
        <p>
          Here&apos;s what public SEC filings currently show for the precious-metals names you
          submitted — insider Form 4 activity, institutional 13F context, and any large 13D/13G
          stakes we have on file. Plain facts, plus a short note on how to read each signal.
        </p>

        {skippedInvalidTickers.length > 0 ? (
          <p style={{ fontSize: "13px", color: "#5C5649" }}>
            We skipped {skippedInvalidTickers.length} invalid ticker
            {skippedInvalidTickers.length === 1 ? "" : "s"}: {skippedInvalidTickers.join(", ")}.
          </p>
        ) : null}

        {tickers.map((t) => (
          <TickerBlock key={t.ticker} readout={t} />
        ))}

        <p style={{ marginTop: "24px", fontSize: "15px" }}>
          I break down moves like these regularly on my Substack —{" "}
          <a href={substackUrl} style={{ color: "#C9971C" }}>
            {substackUrl.replace(/^https?:\/\//, "")}
          </a>
          .
        </p>

        <p>Questions? Reply to this email.</p>
        <p>— GoldSignal.ai</p>

        <hr style={{ border: "none", borderTop: "1px solid #E8E2D6", margin: "24px 0" }} />
        <p style={{ fontSize: "12px", color: "#5C5649" }}>
          Educational information sourced from public SEC filings and exchange data. Not investment
          advice. No buy/sell recommendations or predictions are implied.
        </p>
        <p style={{ fontSize: "12px", color: "#5C5649" }}>
          <a href="https://goldsignal.ai/signalscore" style={{ color: "#C9971C" }}>
            How GoldSignal works
          </a>
        </p>
      </body>
    </html>
  );
}

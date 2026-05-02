import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getInvestorBySlug,
  getHoldingsForInvestor,
  formatUSD,
  formatShares,
} from "@/lib/data";
import {
  getSeedHoldingsForSlug,
  getSeedInvestorBySlug,
} from "@/lib/seed-data";
import type { HoldingWithSecurity, Investor } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

function ChangeChip({ type, pct }: { type: string | null; pct: number | null }) {
  if (!type || type === "unchanged") {
    return <span className="badge badge-silver">—</span>;
  }
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "NEW", cls: "badge-new" },
    add: { label: "ADD", cls: "badge-new" },
    reduce: { label: "TRIM", cls: "badge-sell" },
    sell: { label: "SOLD", cls: "badge-sell" },
  };
  const m = map[type] ?? { label: type.toUpperCase(), cls: "badge-silver" };
  return (
    <span className={`badge ${m.cls}`}>
      {m.label}
      {pct != null && ` ${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`}
    </span>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const fallbackTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  let title = getSeedInvestorBySlug(slug)?.name ?? fallbackTitle;
  try {
    const live = await getInvestorBySlug(slug);
    if (live?.name) title = live.name;
  } catch {
    // keep seed / fallback title
  }

  return { title };
}

export default async function InvestorPage({ params }: Props) {
  const { id: slug } = await params;

  let investor: Investor | null = getSeedInvestorBySlug(slug);
  let holdings: HoldingWithSecurity[] = getSeedHoldingsForSlug(slug);

  try {
    const live = await getInvestorBySlug(slug);
    if (live) {
      investor = live;
      holdings = await getHoldingsForInvestor(live.id);
    }
  } catch {
    // seed already applied
  }

  if (!investor) notFound();

  const totalValue = holdings.reduce((s, h) => s + h.value_usd, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Investor header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
          ← <a href="/investors" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Investors</a>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontFamily: "var(--font-display)", marginBottom: 6 }}>
              {investor.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>{investor.bio}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {investor.focus.map((f) => (
                <span key={f} className="badge badge-gold" style={{ fontSize: 10 }}>{f}</span>
              ))}
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-dim)",
              borderRadius: 10,
              padding: "16px 22px",
              minWidth: 180,
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 6 }}>
              PORTFOLIO VALUE
            </div>
            <div style={{ fontSize: 24, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-gold)" }}>
              {formatUSD(totalValue)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Q1 2025 · {holdings.length} positions</div>
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-dim)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-dim)" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>
            Holdings
          </span>
          <span style={{ marginLeft: 10, fontSize: 13, color: "var(--text-secondary)" }}>
            Q1 2025 · as filed
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gs-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th style={{ textAlign: "right" }}>Shares</th>
                <th style={{ textAlign: "right" }}>Value (USD)</th>
                <th style={{ textAlign: "right" }}>% Portfolio</th>
                <th style={{ textAlign: "right" }}>Activity</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.id}>
                  <td>
                    <span
                      className="mono"
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text-gold)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {h.security.ticker}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{h.security.name}</div>
                    {h.security.country && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {h.security.country}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        h.security.sector?.includes("Royalty") || h.security.sector?.includes("Stream")
                          ? "badge-gold"
                          : "badge-silver"
                      }`}
                    >
                      {h.security.sub_sector ?? h.security.sector}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    {formatShares(h.shares)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatUSD(h.value_usd)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {h.portfolio_pct != null && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                          {h.portfolio_pct.toFixed(1)}%
                        </span>
                        <div
                          style={{
                            width: Math.max(4, h.portfolio_pct * 4),
                            height: 3,
                            background: "var(--gold-400)",
                            borderRadius: 2,
                            opacity: 0.5,
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <ChangeChip type={h.change_type} pct={h.change_pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {holdings.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No holdings data for this period yet.
          </div>
        )}
      </div>
    </div>
  );
}

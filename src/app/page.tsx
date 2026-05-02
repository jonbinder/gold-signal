import Link from "next/link";
import { getInvestors, getLeaderboard } from "@/lib/data";

// Fallback data for when DB is empty (initial dev)
const MOCK_STATS = {
  managers: 5,
  holdings: 0,
  quarter: "Q1 2025",
};

const FEATURED_TICKERS = [
  { ticker: "WPM", name: "Wheaton Precious Metals", sector: "Streaming", owners: 4 },
  { ticker: "AEM", name: "Agnico Eagle Mines", sector: "Gold Miner", owners: 3 },
  { ticker: "FNV", name: "Franco-Nevada", sector: "Royalty", owners: 3 },
  { ticker: "NEM", name: "Newmont Corporation", sector: "Gold Miner", owners: 3 },
  { ticker: "GDX", name: "VanEck Gold Miners ETF", sector: "ETF", owners: 2 },
];

export default async function HomePage() {
  // Attempt to load live data; fall back gracefully
  let investorCount = MOCK_STATS.managers;
  try {
    const investors = await getInvestors();
    if (investors.length > 0) investorCount = investors.length;
  } catch {
    // DB not connected yet
  }

  let leaderboard = FEATURED_TICKERS;
  try {
    const live = await getLeaderboard(undefined, 5);
    if (live.length > 0) {
      leaderboard = live.map((e) => ({
        ticker: e.security.ticker,
        name: e.security.name,
        sector: e.security.sector ?? "—",
        owners: e.stats.owner_count,
      }));
    }
  } catch {
    // Use mock data
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 80,
          paddingBottom: 64,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 32,
          textAlign: "center",
        }}
      >
        {/* Kicker */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span
            className="badge badge-gold"
            style={{ fontSize: 10, letterSpacing: "0.15em" }}
          >
            ◆ Smart Money Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 68px)",
            lineHeight: 1.05,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--text-primary)",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          Track What Top Managers
          <br />
          <span
            style={{
              color: "var(--text-gold)",
              textShadow: "0 0 40px rgba(201,168,76,0.3)",
            }}
          >
            Own in Gold & Silver
          </span>
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          GoldSignal aggregates 13F filings from precious metals fund managers —
          giving you full transparency into institutional positions across miners,
          royalty companies, and ETFs.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/investors"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 28px",
              background: "linear-gradient(135deg, var(--gold-400), var(--gold-300))",
              color: "#0a0a0a",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            View Investors →
          </Link>
          <Link
            href="/leaderboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 28px",
              background: "var(--bg-raised)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-mid)",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Leaderboard
          </Link>
        </div>
      </section>

      {/* ── Stat bar ──────────────────────────────────────── */}
      <div className="rule-gold" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 0,
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        {[
          { label: "Fund Managers", value: investorCount.toString() },
          { label: "Filing Quarter", value: MOCK_STATS.quarter },
          { label: "Universe", value: "22 Tickers" },
          { label: "Data Source", value: "SEC 13F" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: "20px 24px",
              borderRight: i < 3 ? "1px solid var(--border-dim)" : "none",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--text-gold)",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 4,
                fontFamily: "var(--font-mono)",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      <div className="rule-gold" />

      {/* ── Most Owned Preview ────────────────────────────── */}
      <section style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 28,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Most Owned Miners
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 14 }}>
              Top holdings by number of tracked managers
            </p>
          </div>
          <Link
            href="/leaderboard"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-gold)",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            VIEW ALL →
          </Link>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-dim)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table className="gs-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th style={{ textAlign: "right" }}>Managers</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.ticker}>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {i + 1}
                    </span>
                  </td>
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
                      {row.ticker}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        row.sector?.includes("Stream") || row.sector?.includes("Royal")
                          ? "badge-gold"
                          : "badge-silver"
                      }`}
                    >
                      {row.sector}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: Math.max(4, (row.owners / 5) * 60),
                          height: 4,
                          background: "var(--gold-400)",
                          borderRadius: 2,
                          opacity: 0.6,
                        }}
                      />
                      <span
                        className="mono"
                        style={{ fontSize: 13, color: "var(--text-primary)" }}
                      >
                        {row.owners}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section style={{ paddingBottom: 80 }}>
        <h2
          style={{
            fontSize: 28,
            fontFamily: "var(--font-display)",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          How GoldSignal Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              icon: "01",
              title: "13F Filings",
              desc: "We parse SEC 13F filings from gold & silver fund managers every quarter.",
            },
            {
              icon: "02",
              title: "Holdings Analysis",
              desc: "Track new positions, additions, reductions, and full exits in real time.",
            },
            {
              icon: "03",
              title: "Leaderboard",
              desc: "See which miners command the most institutional conviction across managers.",
            },
            {
              icon: "04",
              title: "Investor Profiles",
              desc: "Deep-dive into each fund's full portfolio with % allocations and history.",
            },
          ].map((card) => (
            <div
              key={card.icon}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-dim)",
                borderRadius: 10,
                padding: "24px 20px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text-gold)",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                }}
              >
                {card.icon}
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontFamily: "var(--font-display)",
                  marginBottom: 8,
                }}
              >
                {card.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

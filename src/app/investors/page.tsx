import type { Metadata } from "next";
import Link from "next/link";
import { getInvestors } from "@/lib/data";
import { loadWithFallback } from "@/lib/safe-data";
import { SEED_INVESTORS } from "@/lib/seed-data";
import type { Investor } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Investors",
  description: "Browse gold and silver fund managers tracked by GoldSignal.",
};

function formatAUM(aum: number | null): string {
  if (!aum) return "—";
  if (aum >= 1e12) return `$${(aum / 1e12).toFixed(1)}T`;
  if (aum >= 1e9) return `$${(aum / 1e9).toFixed(1)}B`;
  if (aum >= 1e6) return `$${(aum / 1e6).toFixed(0)}M`;
  return `$${aum}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function InvestorsPage() {
  const live = await loadWithFallback(() => getInvestors(), [] as Investor[]);
  const investors: Investor[] = live.length > 0 ? live : SEED_INVESTORS;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontFamily: "var(--font-display)",
            marginBottom: 10,
          }}
        >
          Fund Managers
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
          {investors.length} gold & silver focused managers tracked
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {investors.map((inv, idx) => (
          <Link
            key={inv.id}
            href={`/investors/${inv.slug}`}
            style={{
              display: "block",
              textDecoration: "none",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-dim)",
              borderRadius: 12,
              padding: "20px 22px",
              transition: "border-color 0.2s, background 0.2s",
              animationDelay: `${idx * 60}ms`,
            }}
            className="animate-fadeUp"
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))",
                  border: "1px solid var(--border-mid)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-gold)",
                  flexShrink: 0,
                  letterSpacing: "0.03em",
                }}
              >
                {getInitials(inv.name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--text-primary)",
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inv.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {inv.firm ?? "Independent"}
                </div>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text-gold)",
                  flexShrink: 0,
                }}
              >
                {formatAUM(inv.aum_usd)}
              </div>
            </div>

            {/* Bio */}
            {inv.bio && (
              <p
                style={{
                  marginTop: 14,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {inv.bio}
              </p>
            )}

            {/* Focus tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
              {inv.focus.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="badge badge-silver"
                  style={{ fontSize: 10 }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                color: "var(--text-gold)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              VIEW HOLDINGS →
            </div>
          </Link>
        ))}
      </div>

      {/* Add more placeholder */}
      <div
        style={{
          marginTop: 32,
          border: "1px dashed var(--border-dim)",
          borderRadius: 12,
          padding: "32px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          + Add 20–30 more managers via Supabase dashboard or import script
        </span>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getLeaderboard, formatUSD } from "@/lib/data";
import { loadWithFallback } from "@/lib/safe-data";
import type { LeaderboardEntry } from "@/types";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Most widely owned gold and silver stocks by tracked fund managers.",
};

export const revalidate = 3600; // revalidate every hour

// Seed data for UI dev
const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { security: { id:"s1",ticker:"WPM",exchange:"NYSE",name:"Wheaton Precious Metals",sector:"Royalty/Streaming",sub_sector:"Streaming",country:"Canada",market_cap:24e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st1",security_id:"s1",period_id:"p1",owner_count:4,total_shares:12_000_000,total_value_usd:528_000_000,new_buyers:1,sellers:0,updated_at:""} },
  { security: { id:"s2",ticker:"AEM",exchange:"NYSE",name:"Agnico Eagle Mines",sector:"Gold Miner",sub_sector:"Senior Producer",country:"Canada",market_cap:44e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st2",security_id:"s2",period_id:"p1",owner_count:3,total_shares:9_600_000,total_value_usd:555_000_000,new_buyers:0,sellers:0,updated_at:""} },
  { security: { id:"s3",ticker:"FNV",exchange:"NYSE",name:"Franco-Nevada Corporation",sector:"Royalty/Streaming",sub_sector:"Royalty",country:"Canada",market_cap:28e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st3",security_id:"s3",period_id:"p1",owner_count:3,total_shares:7_200_000,total_value_usd:324_000_000,new_buyers:0,sellers:1,updated_at:""} },
  { security: { id:"s4",ticker:"NEM",exchange:"NYSE",name:"Newmont Corporation",sector:"Gold Miner",sub_sector:"Senior Producer",country:"USA",market_cap:52e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st4",security_id:"s4",period_id:"p1",owner_count:3,total_shares:8_000_000,total_value_usd:336_000_000,new_buyers:1,sellers:0,updated_at:""} },
  { security: { id:"s5",ticker:"GDX",exchange:"NYSEARCA",name:"VanEck Gold Miners ETF",sector:"ETF",sub_sector:"Senior ETF",country:"USA",market_cap:null,logo_url:null,is_active:true,created_at:""}, stats:{id:"st5",security_id:"s5",period_id:"p1",owner_count:2,total_shares:16_000_000,total_value_usd:560_000_000,new_buyers:2,sellers:0,updated_at:""} },
  { security: { id:"s6",ticker:"RGLD",exchange:"NASDAQ",name:"Royal Gold Inc",sector:"Royalty/Streaming",sub_sector:"Royalty",country:"USA",market_cap:12e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st6",security_id:"s6",period_id:"p1",owner_count:2,total_shares:3_400_000,total_value_usd:170_000_000,new_buyers:0,sellers:0,updated_at:""} },
  { security: { id:"s7",ticker:"PAAS",exchange:"NASDAQ",name:"Pan American Silver Corp",sector:"Silver Miner",sub_sector:"Senior Producer",country:"Canada",market_cap:7e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st7",security_id:"s7",period_id:"p1",owner_count:2,total_shares:6_000_000,total_value_usd:96_000_000,new_buyers:1,sellers:0,updated_at:""} },
  { security: { id:"s8",ticker:"GOLD",exchange:"NYSE",name:"Barrick Gold Corporation",sector:"Gold Miner",sub_sector:"Senior Producer",country:"Canada",market_cap:36e9,logo_url:null,is_active:true,created_at:""}, stats:{id:"st8",security_id:"s8",period_id:"p1",owner_count:2,total_shares:11_000_000,total_value_usd:198_000_000,new_buyers:0,sellers:1,updated_at:""} },
];

const MAX_OWNERS = 5;

function sectorColor(sector: string | null): string {
  if (!sector) return "badge-silver";
  if (sector.includes("Royalty") || sector.includes("Stream")) return "badge-gold";
  if (sector.includes("Silver")) return "badge-silver";
  return "badge-silver";
}

export default async function LeaderboardPage() {
  const live = await loadWithFallback(() => getLeaderboard(undefined, 25), []);
  const entries = live.length > 0 ? live : SEED_LEADERBOARD;

  // Group by sector for summary
  const sectors: Record<string, number> = {};
  entries.forEach((e) => {
    const s = e.security.sector ?? "Other";
    sectors[s] = (sectors[s] ?? 0) + 1;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontFamily: "var(--font-display)", marginBottom: 8 }}>
          Leaderboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
          Most widely held gold & silver stocks by tracked fund managers · Q1 2025
        </p>
      </div>

      {/* Sector summary pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
        {Object.entries(sectors).map(([sector, count]) => (
          <div
            key={sector}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-dim)",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-gold)", marginRight: 5 }}>
              {count}
            </span>
            {sector}
          </div>
        ))}
      </div>

      {/* Main table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-dim)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="gs-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th style={{ textAlign: "center" }}>Managers</th>
                <th style={{ textAlign: "right" }}>Total Shares</th>
                <th style={{ textAlign: "right" }}>Total Value</th>
                <th style={{ textAlign: "center" }}>New Buyers</th>
                <th style={{ textAlign: "center" }}>Sellers</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const { security: sec, stats } = entry;
                const barW = (stats.owner_count / MAX_OWNERS) * 100;

                return (
                  <tr key={sec.id}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
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
                        {sec.ticker}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{sec.name}</div>
                      {sec.country && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sec.country}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${sectorColor(sec.sector)}`}>
                        {sec.sub_sector ?? sec.sector}
                      </span>
                    </td>
                    <td>
                      {/* Owner bar */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div
                          style={{
                            width: 80,
                            height: 6,
                            background: "var(--bg-raised)",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${barW}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, var(--gold-500), var(--gold-300))",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {stats.owner_count}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {(stats.total_shares / 1_000_000).toFixed(2)}M
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                      }}
                    >
                      {formatUSD(stats.total_value_usd)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {stats.new_buyers > 0 ? (
                        <span className="badge badge-new">+{stats.new_buyers}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {stats.sellers > 0 ? (
                        <span className="badge badge-sell">−{stats.sellers}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        Data sourced from SEC 13F filings. Covers {entries.length} securities across {Object.keys(sectors).length} sectors.
      </p>
    </div>
  );
}

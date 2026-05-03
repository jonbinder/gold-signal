import type { Metadata } from "next";
import { getLeaderboard, formatUSD } from "@/lib/data";
import { loadWithFallback } from "@/lib/safe-data";
import type { LeaderboardEntry } from "@/types";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Most widely owned gold and silver stocks by tracked fund managers.",
};

export const revalidate = 3600;

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

  const sectors: Record<string, number> = {};
  entries.forEach((e) => {
    const s = e.security.sector ?? "Other";
    sectors[s] = (sectors[s] ?? 0) + 1;
  });

  return (
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">
            Consensus
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Leaderboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Most widely held gold and silver securities across tracked managers · Q1 2025
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(sectors).map(([sector, count]) => (
              <span
                key={sector}
                className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs text-slate-700"
              >
                <span className="font-mono font-semibold text-gold-600">{count}</span>
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="gs-table min-w-[880px]">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>Sector</th>
                  <th className="text-center">Managers</th>
                  <th className="text-right">Total shares</th>
                  <th className="text-right">Total value</th>
                  <th className="text-center">New buyers</th>
                  <th className="text-center">Sellers</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const { security: sec, stats } = entry;
                  const barW = (stats.owner_count / MAX_OWNERS) * 100;
                  return (
                    <tr key={sec.id}>
                      <td>
                        <span className="font-mono text-xs text-slate-400">{i + 1}</span>
                      </td>
                      <td>
                        <span className="font-mono text-sm font-bold tracking-wide text-gold-600">{sec.ticker}</span>
                      </td>
                      <td>
                        <div className="font-medium text-navy-900">{sec.name}</div>
                        {sec.country && <div className="text-xs text-slate-500">{sec.country}</div>}
                      </td>
                      <td>
                        <span className={`badge ${sectorColor(sec.sector)}`}>{sec.sub_sector ?? sec.sector}</span>
                      </td>
                      <td>
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-1.5 w-20 overflow-hidden rounded-sm bg-navy-100">
                            <div
                              className="h-full rounded-sm bg-gradient-to-r from-gold-600 to-gold-400"
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-navy-900">{stats.owner_count}</span>
                        </div>
                      </td>
                      <td className="text-right font-mono text-sm text-slate-600">
                        {(stats.total_shares / 1_000_000).toFixed(2)}M
                      </td>
                      <td className="text-right font-mono text-sm font-medium text-navy-900">
                        {formatUSD(stats.total_value_usd)}
                      </td>
                      <td className="text-center">
                        {stats.new_buyers > 0 ? (
                          <span className="badge badge-new">+{stats.new_buyers}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        {stats.sellers > 0 ? (
                          <span className="badge badge-sell">−{stats.sellers}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 font-mono text-xs text-slate-500">
          Data from SEC 13F filings. {entries.length} securities · {Object.keys(sectors).length} sectors.
        </p>
      </div>
    </div>
  );
}

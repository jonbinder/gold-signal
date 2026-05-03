import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
import { loadWithFallback } from "@/lib/safe-data";

export const revalidate = 300;

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

  const seedName = getSeedInvestorBySlug(slug)?.name;
  const live = await loadWithFallback(() => getInvestorBySlug(slug), null);
  const title = live?.name ?? seedName ?? fallbackTitle;

  return { title };
}

export default async function InvestorPage({ params }: Props) {
  const { id: slug } = await params;

  let investor: Investor | null = getSeedInvestorBySlug(slug);
  let holdings: HoldingWithSecurity[] = getSeedHoldingsForSlug(slug);

  const live = await loadWithFallback(() => getInvestorBySlug(slug), null);
  if (live) {
    investor = live;
    holdings = await loadWithFallback(() => getHoldingsForInvestor(live.id), holdings);
  }

  if (!investor) notFound();

  const totalValue = holdings.reduce((s, h) => s + h.value_usd, 0);

  return (
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href="/investors"
            className="inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-gold-600"
          >
            <ChevronLeft className="size-4" />
            Investors
          </Link>
          <div className="mt-6 flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{investor.name}</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{investor.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {investor.focus.map((f) => (
                  <span key={f} className="badge badge-gold text-[10px]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 rounded-sm border border-navy-200 bg-navy-50 px-6 py-5 text-right shadow-sm">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Portfolio value
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-gold-600 sm:text-3xl">{formatUSD(totalValue)}</div>
              <div className="mt-2 text-xs text-slate-600">Q1 2025 · {holdings.length} positions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-baseline gap-2 border-b border-navy-200 bg-navy-50 px-4 py-4 sm:px-6">
            <span className="text-lg font-bold text-navy-900">Holdings</span>
            <span className="text-sm text-slate-600">Q1 2025 · as filed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="gs-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>Sector</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Value (USD)</th>
                  <th className="text-right">% portfolio</th>
                  <th className="text-right">Activity</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <span className="font-mono text-sm font-bold tracking-wide text-gold-600">{h.security.ticker}</span>
                    </td>
                    <td>
                      <div className="font-medium text-navy-900">{h.security.name}</div>
                      {h.security.country && (
                        <div className="text-xs text-slate-500">{h.security.country}</div>
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
                    <td className="text-right font-mono text-sm text-slate-700">{formatShares(h.shares)}</td>
                    <td className="text-right font-mono text-sm font-medium text-navy-900">{formatUSD(h.value_usd)}</td>
                    <td className="text-right">
                      {h.portfolio_pct != null && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-sm">{h.portfolio_pct.toFixed(1)}%</span>
                          <div
                            className="h-1 rounded-sm bg-gold-400/80"
                            style={{ width: `${Math.max(6, h.portfolio_pct * 3)}px` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="text-right">
                      <ChangeChip type={h.change_type} pct={h.change_pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {holdings.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">No holdings data for this period yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

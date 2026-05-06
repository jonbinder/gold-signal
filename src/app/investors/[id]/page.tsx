import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getInvestorBySlug } from "@/lib/investors";

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShares(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const fallbackTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const investor = await getInvestorBySlug(slug);
  const title = investor?.name ?? fallbackTitle;

  return { title };
}

export default async function InvestorPage({ params }: Props) {
  const { id: slug } = await params;
  const investor = await getInvestorBySlug(slug);

  if (!investor) notFound();

  const holdings = [...investor.portfolio].sort((a, b) => b.value - a.value);
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);

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
              <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-wide text-gold-700">{investor.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{investor.description}</p>
              <div className="mt-4">
                <span className="badge badge-gold text-[10px]">JSON-backed profile</span>
              </div>
            </div>
            <div className="shrink-0 rounded-sm border border-navy-200 bg-navy-50 px-6 py-5 text-right shadow-sm">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Portfolio value
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-gold-600 sm:text-3xl">{formatUSD(totalValue)}</div>
              <div className="mt-2 text-xs text-slate-600">
                {investor.lastUpdated ?? "Latest update"} · {holdings.length} positions
              </div>
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
                  <th className="text-right">Shares</th>
                  <th className="text-right">Value (USD)</th>
                  <th className="text-right">% portfolio</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.ticker}>
                    <td>
                      <span className="font-mono text-sm font-bold tracking-wide text-gold-600">{h.ticker}</span>
                    </td>
                    <td className="text-right font-mono text-sm text-slate-700">{formatShares(h.shares)}</td>
                    <td className="text-right font-mono text-sm font-medium text-navy-900">{formatUSD(h.value)}</td>
                    <td className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm">
                          {totalValue > 0 ? ((h.value / totalValue) * 100).toFixed(1) : "0.0"}%
                        </span>
                        <div
                          className="h-1 rounded-sm bg-gold-400/80"
                          style={{
                            width: `${Math.max(6, Math.round(((totalValue > 0 ? h.value / totalValue : 0) * 100) * 3))}px`,
                          }}
                        />
                      </div>
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

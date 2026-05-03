import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">
            Fund managers
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Investor coverage</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            {investors.length} gold and silver focused managers on file — select a profile for full holdings and
            allocation detail.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {investors.map((inv, idx) => (
            <Link
              key={inv.id}
              href={`/investors/${inv.slug}`}
              className="group flex flex-col rounded-sm border border-navy-200 bg-white p-5 shadow-sm transition-all hover:border-gold-400/60 hover:shadow-md animate-fadeUp"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-gold-400/40 bg-gold-100 font-mono text-sm font-bold text-gold-700">
                  {getInitials(inv.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-navy-900">{inv.name}</div>
                  <div className="truncate text-sm text-slate-600">{inv.firm ?? "Independent"}</div>
                </div>
                <div className="shrink-0 font-mono text-xs font-semibold text-gold-600">{formatAUM(inv.aum_usd)}</div>
              </div>
              {inv.bio && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{inv.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {inv.focus.slice(0, 4).map((tag) => (
                  <span key={tag} className="badge badge-silver text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-wide text-gold-600">
                View holdings
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-sm border border-dashed border-navy-300 bg-white/80 px-6 py-10 text-center">
          <p className="font-mono text-xs text-slate-500">
            Add 20–30 more managers via the Supabase dashboard or your import pipeline.
          </p>
        </div>
      </div>
    </div>
  );
}

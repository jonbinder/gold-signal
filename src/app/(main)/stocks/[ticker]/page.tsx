import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { isTrackedTicker } from "@/lib/portfolio-universe";
import {
  formatAsOfDate,
  formatInsiderNetLabel,
  formatMarketCapDisplay,
  getStockFactsModel,
} from "@/lib/stock-facts";
import { StockLogo } from "@/components/stocks/StockLogo";

export const revalidate = 3600;

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const upper = ticker.trim().toUpperCase();
  const model = await getStockFactsModel(upper);
  if (!model) {
    return { title: "Stock not found — GoldSignal.ai" };
  }
  const title = `${model.name} (${upper}): Who Owns It & Insider Activity — GoldSignal.ai`;
  const description = `See which tracked precious-metals investors hold ${model.name} (${upper}) and review recent SEC Form 4 insider buying and selling.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://goldsignal.ai/stocks/${upper}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function fmtUsd(n: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function fmtShares(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function fmtInsiderValueUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return fmtUsd(n);
}

export default async function StockDetailPage({ params }: Props) {
  const { ticker } = await params;
  const sym = ticker.trim().toUpperCase();
  if (!(await isTrackedTicker(sym))) notFound();

  const model = await getStockFactsModel(sym);
  if (!model) notFound();

  const netLabel = formatInsiderNetLabel(model.insiderNet90dUsd);
  const asOf = formatAsOfDate(model.insiderAsOf);

  return (
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/stocks"
            className="inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-gold-600"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Stocks
          </Link>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-navy-200 bg-white sm:h-24 sm:w-24">
              {model.logoUrl ? (
                <Image
                  src={model.logoUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="h-full w-full object-contain p-2"
                  unoptimized={model.logoUrl.includes(".svg")}
                />
              ) : (
                <StockLogo ticker={sym} logoUrl="" size={48} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold-700">
                {model.exchange ?? "—"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                {model.name}{" "}
                <span className="font-mono text-gold-700">({sym})</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        {/* Held by smart money */}
        <section className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="border-b border-navy-200 bg-navy-100 px-4 py-3 sm:px-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">Held by smart money</h2>
            <p className="mt-1 text-xs text-slate-600">
              Tracked famous precious-metals investors with this ticker in their disclosed holdings.
            </p>
          </div>
          <div className="px-4 py-6 sm:px-6">
            {model.famousHolderCount === 0 ? (
              <p className="text-sm text-slate-600">No tracked investors currently hold this stock.</p>
            ) : (
              <>
                <p className="mb-4 text-sm font-semibold text-navy-900">
                  Held by {model.famousHolderCount} tracked investor
                  {model.famousHolderCount === 1 ? "" : "s"}
                </p>
                <ul className="space-y-2">
                  {model.famousHolders.map((h) => (
                    <li key={h.slug}>
                      <Link
                        href={`/investors/${h.slug}`}
                        className="text-sm font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:text-blue-700"
                      >
                        {h.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* Insider activity */}
        <section className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="border-b border-navy-200 bg-navy-100 px-4 py-3 sm:px-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">Recent insider activity</h2>
            <p className="mt-1 text-xs text-slate-600">
              SEC Form 4 transactions (non-derivative common stock).
              {asOf ? ` As of ${asOf}.` : null}
            </p>
          </div>
          <div className="border-b border-navy-200 px-4 py-3 sm:px-6">
            <p
              className={`text-sm font-semibold ${
                netLabel.tone === "buy"
                  ? "text-emerald-700"
                  : netLabel.tone === "sell"
                    ? "text-red-700"
                    : "text-slate-600"
              }`}
            >
              90-day net insider activity: {netLabel.text}
            </p>
          </div>
          {model.insider.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-600">No recent insider transactions on file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="gs-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Name</th>
                    <th className="text-right tabular-nums">Shares</th>
                    <th className="text-right tabular-nums">Value</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {model.insider.map((row, i) => (
                    <tr key={`${row.dateIso}-${row.name}-${i}`}>
                      <td>
                        <span
                          className={`inline-block min-w-[2.75rem] font-semibold ${
                            row.type === "BUY" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="max-w-[10rem] truncate font-mono text-sm text-navy-800">{row.title}</td>
                      <td className="max-w-[12rem] truncate font-mono text-sm font-medium uppercase text-navy-900">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap text-right font-mono text-sm tabular-nums">
                        {fmtShares(row.shares)}
                      </td>
                      <td className="whitespace-nowrap text-right font-mono text-sm tabular-nums">
                        {fmtInsiderValueUsd(row.valueUsd)}
                      </td>
                      <td className="whitespace-nowrap font-mono text-sm text-navy-700">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Company facts */}
        <section className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="border-b border-navy-200 bg-navy-100 px-4 py-3 sm:px-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">Company facts</h2>
          </div>
          <div className="px-4 py-6 sm:px-6">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">CEO</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{model.ceo ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Market cap
                </dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">
                  {formatMarketCapDisplay(model.marketCap)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Sector
                </dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{model.sectorLabel}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Exchange
                </dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{model.exchange ?? "—"}</dd>
              </div>
            </dl>
            {model.description ? (
              <p className="mt-6 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
                {model.description}
              </p>
            ) : (
              <p className="mt-6 text-sm text-slate-500">Company description not on file.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

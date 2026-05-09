import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { isTrackedTicker } from "@/lib/portfolio-universe";
import {
  formatHeadquarters,
  formatMarketCapDisplay,
  getStockPageModel,
} from "@/lib/stock-profile";

export const revalidate = 120;
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const upper = ticker.trim().toUpperCase();
  const model = await getStockPageModel(upper);
  const name = model.details?.name ?? upper;
  return {
    title: `${name} (${upper})`,
    description: model.details?.description?.slice(0, 155) ?? `${name} — tracked on GoldSignal.`,
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

function fmtEmployees(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function websiteLabel(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export default async function StockDetailPage({ params }: Props) {
  const { ticker } = await params;
  const sym = ticker.trim().toUpperCase();
  if (!(await isTrackedTicker(sym))) notFound();

  const model = await getStockPageModel(sym);
  const { details, snapshot, week52, pctAbove52WeekLow, insider, ceo, nextEarningsDate, logoUrl } = model;

  const displayName = details?.name ?? sym;
  const description = details?.description ?? "";
  const homepage = details?.homepage_url ?? null;
  const hq = details ? formatHeadquarters(details) : "—";
  const cap = formatMarketCapDisplay(details?.market_cap ?? null);
  const employees = fmtEmployees(details?.total_employees ?? null);

  const price = snapshot?.price ?? null;
  const chg = snapshot?.changePct ?? null;
  const lowStr = week52 ? fmtUsd(week52.low) : "—";
  const highStr = week52 ? fmtUsd(week52.high) : "—";

  const logoSrc = logoUrl;

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

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="relative flex h-28 w-full max-w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-sm border border-navy-200 bg-white px-4 py-3 sm:h-32">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={`${displayName} logo`}
                  width={280}
                  height={112}
                  className="h-full w-auto max-w-full object-contain object-left"
                  priority
                  unoptimized={logoSrc.includes(".svg")}
                  sizes="(max-width: 1024px) 100vw, 280px"
                />
              ) : (
                <span className="font-mono text-2xl font-bold text-navy-400">{sym}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                {displayName}{" "}
                <span className="font-mono text-gold-700">({sym})</span>
              </h1>
              {homepage ? (
                <a
                  href={homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:text-blue-700"
                >
                  {websiteLabel(homepage)}
                </a>
              ) : null}
              {description ? (
                <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
                  {description}
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Company description will appear when Polygon reference data is available.</p>
              )}
            </div>
          </div>

          <hr className="mt-10 border-navy-200" />

          <dl className="mt-8 grid gap-8 sm:grid-cols-2 sm:gap-x-16">
            <div className="space-y-4">
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Market cap</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{cap}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Headquarters</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{hq}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">CEO</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{ceo ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Employees</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{employees}</dd>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Price</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">
                  {price != null ? (
                    <>
                      {fmtUsd(price)}
                      {chg != null ? (
                        <span className={chg >= 0 ? " ml-2 text-emerald-600" : " ml-2 text-red-600"}>
                          {chg >= 0 ? "+" : ""}
                          {chg.toFixed(1)}%
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  % Above 52 week low
                </dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">
                  {pctAbove52WeekLow != null ? `${pctAbove52WeekLow}%` : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Year range</dt>
                <dd className="mt-1 font-mono text-base font-semibold text-navy-900">
                  {lowStr} – {highStr}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Next earnings date</dt>
                <dd className="mt-1 text-base font-semibold text-navy-900">{nextEarningsDate ?? "—"}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
          <div className="border-b border-navy-200 bg-navy-100 px-4 py-3 sm:px-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">Insider buying / selling</h2>
            <p className="mt-1 text-xs text-slate-600">Recent Form 4 transactions (Polygon.io SEC filings).</p>
          </div>
          {insider.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No recent insider transactions returned for this symbol. Data requires a Polygon plan with Form 4 access.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="gs-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {insider.map((row, i) => (
                    <tr key={`${row.dateIso}-${row.name}-${row.title}-${i}`}>
                      <td>
                        <span
                          className={`font-bold ${
                            row.type === "BUY" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap font-mono text-sm text-navy-800">{row.date}</td>
                      <td className="font-mono text-sm text-navy-800">{row.title}</td>
                      <td className="font-mono text-sm font-medium uppercase tracking-wide text-navy-900">{row.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { getTrackedTickerSymbols } from "@/lib/portfolio-universe";
import { getPolygonTickerDetails, resolveStockLogoUrl } from "@/lib/stock-profile";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stocks",
  description: "Companies held by GoldSignal tracked investors — aggregated from portfolio filings.",
};

export default async function StocksIndexPage() {
  const tickers = await getTrackedTickerSymbols();
  const rows = await Promise.all(
    tickers.map(async (t) => {
      const details = await getPolygonTickerDetails(t);
      const logo = resolveStockLogoUrl(details);
      return {
        ticker: t,
        name: details?.name ?? t,
        logo,
      };
    }),
  );

  return (
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-gold-600"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Home
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Portfolio stocks</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Only securities that appear in at least one tracked investor&apos;s book. Select a company for live market
            data from Polygon.io.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {rows.length === 0 ? (
          <p className="rounded-sm border border-navy-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
            No portfolio positions are configured yet.
          </p>
        ) : (
          <ul className="grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row, idx) => (
              <li key={row.ticker}>
                <Link
                  href={`/stocks/${row.ticker}`}
                  className="flex h-full flex-col overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm transition-[border-color,box-shadow] hover:border-gold-400/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-4 border-b border-navy-100 px-5 py-4">
                    <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-navy-100 bg-white">
                      {row.logo ? (
                        <Image
                          src={row.logo}
                          alt={`${row.name} logo`}
                          width={56}
                          height={56}
                          className="max-h-full max-w-full object-contain p-1"
                          unoptimized={row.logo.includes(".svg")}
                          sizes="56px"
                          priority={idx < 6}
                        />
                      ) : (
                        <span className="font-mono text-xs font-bold text-navy-400">{row.ticker.slice(0, 3)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold uppercase tracking-wide text-gold-700">{row.ticker}</p>
                      <p className="truncate text-base font-semibold text-navy-900">{row.name}</p>
                    </div>
                  </div>
                  <div className="px-5 py-3 text-xs font-medium text-gold-600">View profile →</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

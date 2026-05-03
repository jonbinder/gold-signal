import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, LineChart, PieChart, Shield } from "lucide-react";
import { FEATURED_INVESTORS } from "@/lib/featured-investors";
import { Button } from "@/components/ui/button";
import { NewsletterStrip } from "@/components/home/NewsletterStrip";

export const revalidate = 300;

const MOCK_STATS = {
  quarter: "Q1 2025",
};

const FEATURED_TICKERS = [
  { ticker: "WPM", name: "Wheaton Precious Metals", sector: "Streaming", owners: 4 },
  { ticker: "AEM", name: "Agnico Eagle Mines", sector: "Gold Miner", owners: 3 },
  { ticker: "FNV", name: "Franco-Nevada", sector: "Royalty", owners: 3 },
  { ticker: "NEM", name: "Newmont Corporation", sector: "Gold Miner", owners: 3 },
  { ticker: "GDX", name: "VanEck Gold Miners ETF", sector: "ETF", owners: 2 },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1580828343064-58d38262bd85?auto=format&fit=crop&w=2400&q=82";

export default async function HomePage() {
  const investorCount = FEATURED_INVESTORS.length;
  const leaderboard = FEATURED_TICKERS;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[320px] w-full overflow-hidden sm:min-h-[420px] lg:min-h-[480px]">
        <Image
          src={HERO_IMAGE}
          alt="Open-pit mining landscape"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/45 to-navy-950/30" />
        <div className="absolute inset-0 flex items-center justify-center px-4 py-16 sm:py-24">
          <div className="w-full max-w-4xl border-y border-gold-500/40 bg-gold-500/20 px-4 py-8 text-center shadow-sm backdrop-blur-[2px] sm:px-10 sm:py-10">
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-200 sm:text-xs">
              Precious metals · 13F holdings
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[2.75rem]">
              Tracking the Smart Money in Gold &amp; Silver
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-navy-100 sm:text-base">
              GoldSignal aggregates quarterly SEC 13F filings from specialist fund managers — so you can see
              conviction across miners, royalties, streamers, and sector ETFs.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="gold" size="lg" asChild>
                <Link href="/investors">
                  View investors
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/40 bg-navy-950/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/gold-silver-stocks">Stocks</Link>
              </Button>
            </div>
          </div>
        </div>
        <p className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-wider text-white/70 sm:bottom-4 sm:left-6 sm:text-xs">
          Representative mining operations · Photo reference
        </p>
      </section>

      <section className="border-b border-navy-200/80 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              Welcome to <span className="text-gold-600">GoldSignal</span>
            </h2>
            <p className="mt-6 text-base font-semibold text-navy-800 sm:text-lg">
              A professional view of where sophisticated institutions are positioned in the gold and silver
              complex.
            </p>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
              Whether you follow senior producers, royalty names, or silver leverage, our dashboards surface
              ownership breadth, portfolio weights, and quarter-over-quarter activity — in one place.
            </p>
            <Button variant="default" className="mt-8" asChild>
              <Link href="/investors">Read more about our coverage</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-navy-200 bg-navy-50">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 divide-x divide-navy-200/80 md:grid-cols-4">
            {[
              { label: "Fund managers", value: investorCount.toString() },
              { label: "Filing quarter", value: MOCK_STATS.quarter },
              { label: "Stock universe", value: "150+ tickers" },
              { label: "Data source", value: "SEC 13F" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-6 text-center sm:py-8">
                <div className="font-mono text-xl font-semibold text-gold-600 sm:text-2xl">{stat.value}</div>
                <div className="mt-1 font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-[11px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-void)] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Featured precious metals names</h2>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">Sample tickers from our gold &amp; silver stock directory</p>
            </div>
            <Link
              href="/gold-silver-stocks"
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-wide text-gold-600 hover:text-gold-700"
            >
              View stocks
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm">
            <table className="gs-table">
              <thead>
                <tr>
                  <th className="w-10 sm:w-12">#</th>
                  <th>Ticker</th>
                  <th className="min-w-[140px]">Company</th>
                  <th className="hidden sm:table-cell">Sector</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.ticker}>
                    <td>
                      <span className="font-mono text-xs text-slate-400">{i + 1}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-bold tracking-wide text-gold-600">{row.ticker}</span>
                    </td>
                    <td className="font-medium text-navy-900">{row.name}</td>
                    <td className="hidden sm:table-cell">
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
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="hidden h-1.5 max-w-[60px] rounded-sm bg-gold-400/80 sm:block"
                          style={{ width: `${Math.max(8, (row.owners / 5) * 56)}px` }}
                        />
                        <span className="font-mono text-sm text-navy-900">{row.owners}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-navy-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-navy-900 sm:mb-12 sm:text-3xl">
            How GoldSignal works
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                step: "01",
                title: "13F filings",
                desc: "We ingest and normalize SEC 13F disclosures from precious-metals-focused managers each quarter.",
              },
              {
                icon: LineChart,
                step: "02",
                title: "Holdings analysis",
                desc: "Surface new buys, adds, trims, and exits with portfolio context and historical comparison.",
              },
              {
                icon: PieChart,
                step: "03",
                title: "Stock screener",
                desc: "Browse a curated gold and silver universe with live-style quotes, categories, and market-cap filters.",
              },
              {
                icon: Building2,
                step: "04",
                title: "Investor profiles",
                desc: "Drill into each fund’s full book with weights, sectors, and filing-period metadata.",
              },
            ].map((card) => (
              <div
                key={card.step}
                className="rounded-sm border border-navy-200 bg-navy-50/50 p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <card.icon className="size-8 text-navy-800" strokeWidth={1.25} />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-600">
                    {card.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-navy-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterStrip />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterStrip } from "@/components/home/NewsletterStrip";
import { getInvestors } from "@/lib/investors";
import { getTrackedTickerSymbols } from "@/lib/portfolio-universe";

export const revalidate = 300;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1580828343064-58d38262bd85?auto=format&fit=crop&w=2400&q=82";

export default async function HomePage() {
  const investors = await getInvestors();
  const tickers = await getTrackedTickerSymbols();
  const investorCount = investors.length;
  const stockCount = tickers.length;

  return (
    <>
      <section className="relative min-h-[300px] w-full overflow-hidden sm:min-h-[380px] lg:min-h-[440px]">
        <Image
          src={HERO_IMAGE}
          alt="Open-pit mining landscape"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/50 to-navy-950/35" />
        <div className="absolute inset-0 flex items-center justify-center px-4 py-14 sm:py-20">
          <div className="w-full max-w-3xl border-y border-gold-500/35 bg-gold-500/15 px-5 py-8 text-center shadow-sm backdrop-blur-[2px] sm:px-10 sm:py-10">
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-200 sm:text-xs">
              GoldSignal.ai
            </p>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.65rem]">
              Follow the investors. Own the names they own.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-navy-100 sm:text-base">
              A focused view of precious-metals fund managers and the exact equities in their portfolios — nothing else.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="gold" size="lg" asChild>
                <Link href="/investors">
                  Investors
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/40 bg-navy-950/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/stocks">Stocks</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-navy-200/80 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
              One product surface: <span className="text-gold-600">people</span> and{" "}
              <span className="text-gold-600">positions</span>.
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
              Every company page is tied to a real portfolio weight. No broad commodity directory — just the stocks your
              tracked investors actually hold.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-6 text-center sm:max-w-2xl sm:grid-cols-2">
            <div className="rounded-sm border border-navy-200 bg-navy-50/40 px-5 py-6">
              <div className="font-mono text-2xl font-semibold text-gold-600">{investorCount}</div>
              <div className="mt-1 font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Tracked investors
              </div>
            </div>
            <div className="rounded-sm border border-navy-200 bg-navy-50/40 px-5 py-6">
              <div className="font-mono text-2xl font-semibold text-gold-600">{stockCount}</div>
              <div className="mt-1 font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Portfolio stocks
              </div>
            </div>
          </div>
        </div>
      </section>

      <NewsletterStrip />
    </>
  );
}

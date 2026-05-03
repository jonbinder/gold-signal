import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FEATURED_INVESTORS } from "@/lib/featured-investors";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Investors",
  description: "Gold and silver investors and allocators featured on GoldSignal.",
};

export default function InvestorsPage() {
  return (
    <div className="bg-[var(--bg-void)]">
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">
            Featured investors
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Investor coverage</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Five well-known voices in precious metals and mining. Open a profile for illustrative portfolio tables
            (demo data — not live 13F).
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_INVESTORS.map((inv, idx) => (
            <li
              key={inv.slug}
              className="flex flex-col overflow-hidden rounded-sm border border-navy-200 bg-white shadow-sm transition-shadow hover:border-gold-400/50 hover:shadow-md animate-fadeUp"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="relative aspect-[4/3] w-full bg-navy-100 sm:aspect-[3/2]">
                <Image
                  src={inv.imageSrc}
                  alt={inv.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={idx < 2}
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-tight text-navy-900 sm:text-xl">{inv.name}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{inv.tagline}</p>
                <Button variant="gold" className="mt-5 w-full sm:w-auto" asChild>
                  <Link href={`/investors/${inv.slug}`}>View portfolio</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

const COLS = [
  {
    title: "Platform",
    links: [
      { href: "/", label: "Home" },
      { href: "/investors", label: "Investors" },
      { href: "/stocks", label: "Stocks" },
    ],
  },
  {
    title: "Data",
    links: [
      { href: "/stocks", label: "Portfolio companies" },
      { href: "/investors", label: "Fund managers" },
      { href: "/", label: "Methodology" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth", label: "Sign in" },
      { href: "/auth", label: "Register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/", label: "Disclaimer" },
      { href: "/", label: "Privacy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-[#1a1f26] text-navy-100">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <BrandLogo className="mb-3" imageClassName="max-w-[220px]" sizes="220px" />
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Institutional 13F coverage for gold and silver miners, royalties, and ETFs — built for serious
              precious-metals investors.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-white">{col.title}</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-gold-400">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-4 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="font-mono uppercase tracking-wide">
              Holdings data from SEC 13F filings · Not financial advice · May be delayed up to 45 days after quarter
              end
            </p>
            <p className="text-slate-600">© {new Date().getFullYear()} GoldSignal</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

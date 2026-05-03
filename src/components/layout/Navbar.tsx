import Link from "next/link";
import { BarChart3, Landmark, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy-800/80 bg-navy-950 shadow-sm">
      <div className="border-b border-white/5 bg-black/40 px-4 py-1.5 text-[11px] tracking-wide text-navy-100 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase sm:text-[11px]">
          <span className="text-gold-400">13F intelligence</span>
          <span className="hidden text-navy-200 sm:inline">·</span>
          <span className="text-navy-200">SEC filings · Gold &amp; silver miners</span>
          <span className="ml-auto text-gold-300/90">Q1 2025 coverage</span>
        </div>
      </div>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-500 text-sm font-black tracking-tight text-navy-950 shadow-sm sm:h-10 sm:w-10 sm:text-[15px]">
            GS
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">
              GoldSignal
            </span>
            <span className="text-sm font-bold tracking-tight text-white sm:text-base">
              Holdings Intelligence
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-sm px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy-100 no-underline",
                  "hover:bg-white/5 hover:text-gold-300 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-xs",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80 sm:size-[18px]" strokeWidth={1.5} aria-hidden />
                <span className="max-w-[4.5rem] truncate sm:max-w-none">{link.label}</span>
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-1 hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-200 no-underline hover:text-white md:inline-flex"
          >
            <Landmark className="size-4" strokeWidth={1.5} aria-hidden />
            Overview
          </Link>
          <span
            className="ml-2 hidden h-6 w-px bg-white/10 lg:block"
            aria-hidden
          />
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-sm px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-navy-200 hover:bg-white/5 hover:text-white lg:inline-flex"
            aria-label="Search (coming soon)"
          >
            <Search className="size-4" strokeWidth={1.5} />
            Search
          </button>
          <Button variant="gold" size="sm" className="ml-1 shrink-0" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

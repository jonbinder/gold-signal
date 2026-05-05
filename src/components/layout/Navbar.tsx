import Link from "next/link";
import { Layers, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PreciousMetalsBanner } from "@/components/layout/PreciousMetalsBanner";
import { BrandLogo } from "@/components/layout/BrandLogo";

const NAV_LINKS = [
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/gold-silver-stocks", label: "Stocks", icon: Layers },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy-800/80 bg-navy-950 shadow-sm">
      <div className="border-b border-white/5 bg-gradient-to-b from-black/50 to-black/35 px-3 py-2 text-[11px] tracking-wide text-navy-100 sm:px-6 sm:py-1.5">
        <PreciousMetalsBanner />
      </div>
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[5.75rem] sm:gap-5 sm:px-6">
        <BrandLogo
          priority
          sizes="(min-width: 640px) 460px, 290px"
          className="shrink-0"
          imageClassName="w-auto max-h-12 max-w-[290px] sm:max-h-[58px] sm:max-w-[460px]"
        />

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
          <Button variant="gold" size="sm" className="ml-2 shrink-0" asChild>
            <Link href="/auth">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

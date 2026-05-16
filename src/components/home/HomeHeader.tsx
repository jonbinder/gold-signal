"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Menu, Users, X } from "lucide-react";
import { HomeLogo } from "@/components/home/HomeLogo";

const NAV_LINKS = [
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/stocks", label: "Stocks", icon: Layers },
] as const;

export function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] bg-[rgba(10,10,10,0.55)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <HomeLogo />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white no-underline transition-colors hover:text-[var(--gold-light)]"
              >
                <Icon className="size-[18px] stroke-[1.75]" aria-hidden />
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/auth"
            className="ml-2 inline-flex h-10 items-center justify-center rounded-full bg-[var(--gold)] px-6 text-sm font-bold text-[var(--bg-primary)] no-underline transition-colors hover:bg-[var(--gold-light)]"
          >
            Login
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-sm text-white lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          className="border-t border-[var(--border)] bg-[rgba(10,10,10,0.95)] px-4 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-sm px-2 py-3 text-sm font-bold uppercase tracking-wide text-white no-underline hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon className="size-5" aria-hidden />
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="pt-2">
              <Link
                href="/auth"
                className="flex h-11 items-center justify-center rounded-lg bg-[var(--gold)] text-sm font-bold text-[var(--bg-primary)] no-underline"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

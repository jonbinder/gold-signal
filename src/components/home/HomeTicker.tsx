"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { MarketBannerPayload, MarketBannerQuote } from "@/types/metals-banner";

const REFRESH_MS = 90_000;

function fmtUsd(n: number, maxFractionDigits: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: maxFractionDigits,
  }).format(n);
}

function fmtChg(pct: number | null, loading: boolean): { text: string; className: string } {
  if (loading) return { text: "…", className: "text-[var(--text-secondary)] animate-pulse" };
  if (pct == null || !Number.isFinite(pct)) return { text: "—", className: "text-[var(--text-secondary)]" };
  const sign = pct > 0 ? "+" : "";
  const text = `(${sign}${pct.toFixed(2)}%)`;
  if (pct > 0) return { text, className: "text-emerald-400" };
  if (pct < 0) return { text, className: "text-[var(--red)]" };
  return { text, className: "text-[var(--text-secondary)]" };
}

type RowProps = {
  label: string;
  labelClass: string;
  quote: MarketBannerQuote | null;
  formatPrice: (n: number) => string;
  loading: boolean;
  className?: string;
};

function QuoteRow({ label, labelClass, quote, formatPrice, loading, className }: RowProps) {
  const chg = fmtChg(quote?.changePct ?? null, loading);
  const priceText =
    loading && !quote ? (
      <span className="inline-block min-w-[4.5rem] animate-pulse text-transparent">$0.00</span>
    ) : quote ? (
      formatPrice(quote.price)
    ) : (
      "—"
    );

  return (
    <div
      className={cn(
        "flex shrink-0 items-baseline gap-x-1.5 whitespace-nowrap border-r border-white/10 pr-3 last:border-r-0 last:pr-0 sm:pr-4",
        className,
      )}
    >
      <span className={cn("font-semibold tracking-wide", labelClass)}>{label}</span>
      <span className="tabular-nums text-white">{priceText}</span>
      <span className={cn("tabular-nums text-[11px]", chg.className)}>{chg.text}</span>
    </div>
  );
}

export function HomeTicker() {
  const [data, setData] = useState<MarketBannerPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/metals/banner", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as MarketBannerPayload;
      setData(json);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const stillLoading = loading && data === null;

  return (
    <div
      className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 sm:px-6"
      aria-live="polite"
      aria-busy={stillLoading}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1400px] flex-nowrap items-baseline gap-x-0 overflow-x-auto font-mono text-[11px] tracking-wide sm:text-[13px]",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <QuoteRow
          label="GOLD"
          labelClass="text-[var(--gold)]"
          quote={data?.gold ?? null}
          loading={stillLoading}
          formatPrice={(n) => fmtUsd(n, 2)}
        />
        <QuoteRow
          label="SILVER"
          labelClass="text-[var(--gold-light)]"
          quote={data?.silver ?? null}
          loading={stillLoading}
          formatPrice={(n) => fmtUsd(n, 2)}
        />
        <QuoteRow
          label="S&P 500"
          labelClass="text-[var(--text-secondary)]"
          quote={data?.sp500 ?? null}
          loading={stillLoading}
          formatPrice={(n) =>
            new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
          }
          className="hidden md:flex"
        />
        <QuoteRow
          label="GDX"
          labelClass="text-[var(--gold)]"
          quote={data?.gdx ?? null}
          loading={stillLoading}
          formatPrice={(n) => fmtUsd(n, 2)}
        />
      </div>
    </div>
  );
}

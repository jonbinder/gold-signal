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
  if (loading) {
    return { text: "…", className: "text-navy-400 animate-pulse" };
  }
  if (pct == null || !Number.isFinite(pct)) {
    return { text: "—", className: "text-navy-400" };
  }
  const sign = pct > 0 ? "+" : "";
  const text = `(${sign}${pct.toFixed(2)}%)`;
  if (pct > 0) return { text, className: "text-emerald-400/95" };
  if (pct < 0) return { text, className: "text-red-400/95" };
  return { text, className: "text-navy-300" };
}

type RowProps = {
  label: string;
  labelClass: string;
  ticker: string;
  quote: MarketBannerQuote | null;
  formatPrice: (n: number) => string;
  loading: boolean;
};

function QuoteRow({ label, labelClass, ticker, quote, formatPrice, loading }: RowProps) {
  const chg = fmtChg(quote?.changePct ?? null, loading);
  const priceText =
    loading && !quote ? (
      <span className="inline-block min-w-[4.5rem] animate-pulse rounded bg-white/10 text-transparent">$0.00</span>
    ) : quote ? (
      formatPrice(quote.price)
    ) : (
      "—"
    );

  return (
    <div
      title={`${ticker} · Polygon.io`}
      className={cn(
        "flex shrink-0 items-baseline gap-x-1.5 whitespace-nowrap border-r border-white/[0.06] pr-3 last:border-r-0 last:pr-0 sm:pr-4",
      )}
    >
      <span className={cn("font-semibold tracking-wide", labelClass)}>{label}</span>
      <span className="tabular-nums text-navy-50">{priceText}</span>
      <span className={cn("tabular-nums text-[10px] sm:text-[11px]", chg.className)}>{chg.text}</span>
    </div>
  );
}

export function PreciousMetalsBanner() {
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
      className="mx-auto max-w-6xl font-mono text-[10px] tracking-wide text-navy-100 sm:text-[11px]"
      aria-live="polite"
      aria-busy={stillLoading}
    >
      <div
        className={cn(
          "flex min-h-[1.25rem] flex-nowrap items-baseline gap-x-0 gap-y-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
        )}
      >
        <QuoteRow
          label="GOLD"
          ticker="XAUUSD"
          labelClass="text-gold-400"
          quote={data?.gold ?? null}
          loading={stillLoading}
          formatPrice={(n) => fmtUsd(n, 2)}
        />
        <QuoteRow
          label="SILVER"
          ticker="XAGUSD"
          labelClass="text-slate-300"
          quote={data?.silver ?? null}
          loading={stillLoading}
          formatPrice={(n) => fmtUsd(n, 2)}
        />
        <QuoteRow
          label="S&P 500"
          ticker="I:SPX"
          labelClass="text-navy-200"
          quote={data?.sp500 ?? null}
          loading={stillLoading}
          formatPrice={(n) =>
            new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(n)
          }
        />
        <QuoteRow
          label="GDX"
          ticker="GDX"
          labelClass="text-amber-400/90"
          quote={data?.gdx ?? null}
          loading={stillLoading}
          formatPrice={(n) => fmtUsd(n, 2)}
        />
      </div>
      {stillLoading ? (
        <span className="sr-only">Loading market quotes</span>
      ) : null}
    </div>
  );
}

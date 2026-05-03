"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { MetalsBannerPayload } from "@/types/metals-banner";

const REFRESH_MS = 90_000;

function fmtUsd(n: number, maxFractionDigits: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: maxFractionDigits,
  }).format(n);
}

function fmtChg(pct: number | null): { text: string; className: string } {
  if (pct == null || !Number.isFinite(pct)) {
    return { text: "—", className: "text-navy-200" };
  }
  const sign = pct > 0 ? "+" : "";
  const text = `${sign}${pct.toFixed(2)}%`;
  if (pct > 0) return { text, className: "text-emerald-400/90" };
  if (pct < 0) return { text, className: "text-red-400/90" };
  return { text, className: "text-navy-200" };
}

export function PreciousMetalsBanner() {
  const [data, setData] = useState<MetalsBannerPayload | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/metals/banner", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as MetalsBannerPayload;
      setData(json);
    } catch {
      /* keep previous or empty */
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const goldChg = fmtChg(data?.gold?.changePct ?? null);
  const silverChg = fmtChg(data?.silver?.changePct ?? null);

  return (
    <div
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 font-mono text-[10px] tracking-wide text-navy-100 sm:text-[11px]"
      aria-live="polite"
    >
      <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-gold-400">
        <span className="uppercase">Gold</span>
        <span className="normal-case tabular-nums text-gold-200">
          {data?.gold ? fmtUsd(data.gold.price, 2) : "—"}
        </span>
        <span className={cn("normal-case tabular-nums", goldChg.className)}>{goldChg.text}</span>
      </span>
      <span className="hidden text-navy-200 sm:inline" aria-hidden>
        ·
      </span>
      <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-navy-200">
        <span className="uppercase text-slate-300">Silver</span>
        <span className="normal-case tabular-nums text-slate-100">
          {data?.silver ? fmtUsd(data.silver.price, 2) : "—"}
        </span>
        <span className={cn("normal-case tabular-nums", silverChg.className)}>{silverChg.text}</span>
      </span>
      <span className="ml-auto flex items-baseline gap-x-1.5 text-gold-300/90">
        <span className="uppercase">G/S</span>
        <span className="normal-case tabular-nums text-gold-200">
          {data?.ratio != null ? String(data.ratio) : "—"}
        </span>
      </span>
    </div>
  );
}

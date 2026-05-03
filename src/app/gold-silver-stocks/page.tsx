import type { Metadata } from "next";
import { getGoldSilverStocksForPage } from "@/lib/data";
import { GoldSilverStocksExplorer } from "./GoldSilverStocksExplorer";

export const metadata: Metadata = {
  title: "Gold & Silver Stocks",
  description:
    "Curated universe of gold producers, silver producers, juniors, royalties, and precious-metals ETFs with live-style quotes.",
};

export const revalidate = 300;

export default async function GoldSilverStocksPage() {
  const stocks = await getGoldSilverStocksForPage();

  return (
    <div className="min-h-screen bg-[#060d16] text-slate-100">
      <div className="border-b border-gold-500/25 bg-gradient-to-r from-navy-950 via-[#0a1424] to-navy-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-400">Market data</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Gold &amp; silver stocks</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            A focused directory of producers, explorers, royalty vehicles, and sector ETFs — with live-style pricing
            powered by Polygon.io (Yahoo Finance fallback).
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <GoldSilverStocksExplorer initialStocks={stocks} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { StocksTable } from "@/components/stocks/StocksTable";
import { getCachedDisplayStocks } from "@/lib/stock-cache";

export const metadata: Metadata = {
  title: "Stocks — GoldSignal.ai",
  description:
    "Gold and silver mining and royalty stocks — see which tracked investors hold each name and recent insider Form 4 activity.",
};

export const dynamic = "force-dynamic";

export default async function StocksPage() {
  const stocks = await getCachedDisplayStocks();

  return (
    <main>
      <StocksTable stocks={stocks} />
    </main>
  );
}

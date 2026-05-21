import type { Metadata } from "next";
import { StocksTable } from "@/components/stocks/StocksTable";
import { getEnrichedStocks } from "@/lib/stocks-data";

export const metadata: Metadata = {
  title: "Stocks — GoldSignal.ai",
  description:
    "Gold and silver mining and royalty stocks ranked by SignalScore with market cap, P/E, price history, and 52-week metrics.",
};

export default function StocksPage() {
  const stocks = getEnrichedStocks();

  return (
    <main>
      <StocksTable stocks={stocks} />
    </main>
  );
}

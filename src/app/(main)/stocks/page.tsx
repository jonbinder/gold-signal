import type { Metadata } from "next";
import { PageCompliance } from "@/components/layout/PageCompliance";
import { StocksTable } from "@/components/stocks/StocksTable";
import { getCachedDisplayStocks } from "@/lib/stock-cache";
import "@/app/stocks-list.css";

const pageTitle = "Gold & silver stocks — market data from SEC filings | GoldSignal";
const pageDescription =
  "Browse gold and silver mining and royalty stocks with market cap, price, and daily change — sourced from public filings and cached market data. No scores or predictions.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "https://goldsignal.ai/stocks",
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/stocks",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

/** ISR: cached HTML + Supabase-backed rows; refresh-stocks cron updates data (~daily). */
export const revalidate = 3600;

export default async function StocksPage() {
  const stocks = await getCachedDisplayStocks();

  return (
    <main className="stocks-list-page">
      <StocksTable stocks={stocks} />
      <PageCompliance />
    </main>
  );
}

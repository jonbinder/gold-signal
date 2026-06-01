import type { Metadata } from "next";
import { StocksTable } from "@/components/stocks/StocksTable";
import { getCachedDisplayStocks } from "@/lib/stock-cache";
import "@/app/stocks-list.css";

const pageTitle =
  "Gold & silver stocks — insider & institutional activity from SEC filings | GoldSignal";
const pageDescription =
  "Browse gold and silver mining and royalty stocks with recent SEC Form 4 insider activity, tracked institutional holders from 13F filings, and market cap — sourced from public filings.";

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

export const revalidate = 3600;

export default async function StocksPage() {
  const stocks = await getCachedDisplayStocks();

  return (
    <main className="stocks-list-page">
      <StocksTable stocks={stocks} />
    </main>
  );
}

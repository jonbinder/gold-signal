import type { Metadata } from "next";
import { PortfolioStocksList } from "@/components/stocks/PortfolioStocksList";
import { getSheetSyncedStocks } from "@/lib/stocks/sheet-positions";
import "@/app/funds.css";
import "@/app/stocks-list.css";

const pageTitle = "Stocks — gold & silver names in tracked portfolios | GoldSignal";
const pageDescription =
  "All gold and silver stocks held across tracked investor portfolios, sourced from our synced research sheet and SEC filings.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://goldsignal.ai/stocks" },
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

export default async function StocksIndexPage() {
  const stocks = await getSheetSyncedStocks();

  return (
    <main className="stocks-list-page funds-page">
      <section className="stocks-list-hero" aria-labelledby="stocks-list-heading">
        <div className="stocks-list-hero__inner">
          <p className="stocks-list-hero__eyebrow mono">Tracked universe</p>
          <h1 id="stocks-list-heading" className="stocks-list-hero__title">
            Gold &amp; silver stocks
          </h1>
          <p className="stocks-list-hero__sub">
            {stocks.length} names from synced portfolio positions. No live market data on this page.
          </p>
        </div>
      </section>
      <div className="funds-main stocks-list-main">
        <PortfolioStocksList stocks={stocks} />
      </div>
    </main>
  );
}

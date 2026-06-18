import type { Metadata } from "next";
import "@/app/about-page.css";

const pageTitle = "Data — GoldSignal.ai";
const pageDescription =
  "GoldSignal data sources and coverage for SEC Form 4 insider trades, 13F institutional holdings, and tracked portfolio positions in gold and silver.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://goldsignal.ai/data" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/data",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function DataPage() {
  return (
    <main className="about-page">
      <header className="about-hero">
        <div className="about-hero__inner">
          <p className="about-hero__eyebrow mono">Data</p>
          <h1 className="about-hero__title">Filing-backed coverage</h1>
          <p className="about-hero__sub">
            GoldSignal pulls from public SEC filings and our synced research sheet. This page will expand with
            methodology, refresh cadence, and data definitions.
          </p>
        </div>
      </header>
      <div className="about-main">
        <section className="about-section">
          <h2 className="about-section__title">What we track</h2>
          <ul className="about-list">
            <li>Form 4 insider transactions</li>
            <li>13F institutional holdings</li>
            <li>13D and 13G large stakes</li>
            <li>Notable portfolio positions from our curated sheet</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { SITE_TAGLINE } from "@/lib/site";
import "@/app/about-page.css";

const pageTitle = "About — GoldSignal.ai";
const pageDescription =
  "GoldSignal.ai surfaces smart-money activity in gold and silver stocks from public SEC filings and tracked portfolios.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://goldsignal.ai/about" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/about",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-hero">
        <div className="about-hero__inner">
          <p className="about-hero__eyebrow mono">About</p>
          <h1 className="about-hero__title">GoldSignal.ai</h1>
          <p className="about-hero__sub">{SITE_TAGLINE}</p>
        </div>
      </header>
      <div className="about-main">
        <section className="about-section">
          <h2 className="about-section__title">Our mission</h2>
          <p className="about-section__body">
            We help precious-metals investors follow insider trades, institutional filings, and notable portfolio
            positions without hype or predictions. More about content is coming soon.
          </p>
        </section>
      </div>
    </main>
  );
}

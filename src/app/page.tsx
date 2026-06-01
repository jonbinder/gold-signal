import type { Metadata } from "next";
import { SiteNav } from "@/components/goldsignal/SiteNav";
import { SiteFooter } from "@/components/goldsignal/SiteFooter";
import { WatchlistCaptureForm } from "@/components/home/WatchlistCaptureForm";
import { WhatsNewFeed } from "@/components/home/WhatsNewFeed";
import { SectorInsiderHeatmap } from "@/components/home/SectorInsiderHeatmap";
import { getSectorInsiderHeatmap } from "@/lib/home/sector-heatmap";
import { getWhatsNewFeed } from "@/lib/whats-new/feed";
import { COMPLIANCE_LINE } from "@/lib/site";
import "./whats-new.css";
import "./charts.css";
import "./site-cohesion.css";

const siteTitle = "GoldSignal.ai — Smart Money in Gold & Silver";
const siteDescription =
  "See what the smart money is doing in gold and silver — notable insider buys, large stakes, and institutional moves from public SEC filings.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "https://goldsignal.ai/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "https://goldsignal.ai/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const revalidate = 3600;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GoldSignal.ai",
  description: siteDescription,
  url: "https://goldsignal.ai/",
};

export default async function HomePage() {
  const [feed, heatmap] = await Promise.all([getWhatsNewFeed(), getSectorInsiderHeatmap()]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <SiteNav />

      <main className="home-page home-page--whats-new">
        <section className="whats-new-hero" aria-label="GoldSignal">
          <div className="whats-new-hero__inner">
            <h1 className="whats-new-hero__brand">
              Gold<span className="whats-new-hero__brand-accent">Signal</span>.ai
            </h1>
            <p className="whats-new-hero__tagline">The smart money in gold and silver</p>
            <p className="whats-new-hero__explainer">
              A rolling 7-day view of the most notable Form 4 insider activity, 13D/13G large stakes,
              and 13F institutional moves in our tracked precious-metals universe — straight from public
              SEC filings, no scores or predictions.
            </p>
            <WatchlistCaptureForm />
          </div>
        </section>

        <div className="whats-new-main">
          <SectorInsiderHeatmap model={heatmap} />
          <WhatsNewFeed feed={feed} />
        </div>

        <p className="whats-new-footer-note">{COMPLIANCE_LINE}</p>
      </main>

      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import { SiteNav } from "@/components/goldsignal/SiteNav";
import { SiteFooter } from "@/components/goldsignal/SiteFooter";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { HomeMetalsStrip } from "@/components/home/HomeMetalsStrip";
import { getHomeDashboard } from "@/lib/home/dashboard";
import { getSpotSnapshot } from "@/lib/spot-market";
import { COMPLIANCE_LINE } from "@/lib/site";
import "./home-dashboard.css";
import "./whats-new.css";
import "./site-cohesion.css";

const siteTitle = "GoldSignal.ai — Smart Money in Gold & Silver";
const siteDescription =
  "Recent SEC Form 4 insider trades and tracked investor holdings across gold and silver stocks — sourced from public filings, no scores or predictions.";

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

export const revalidate = 600;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GoldSignal.ai",
  description: siteDescription,
  url: "https://goldsignal.ai/",
};

export default async function HomePage() {
  const [dashboard, spot] = await Promise.all([getHomeDashboard(), getSpotSnapshot()]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <SiteNav />

      <main className="home-page home-page--dashboard">
        <HomeMetalsStrip spot={spot} />
        <HomeDashboard model={dashboard} />
        <p className="home-dashboard-footer-note">{COMPLIANCE_LINE}</p>
      </main>

      <SiteFooter />
    </>
  );
}

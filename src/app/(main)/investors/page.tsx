import type { Metadata } from "next";
import { PageCompliance } from "@/components/layout/PageCompliance";
import { InvestorsList } from "@/components/investors/InvestorsList";
import { getPublishedInvestorsList } from "@/lib/investors/queries";
import "@/app/funds.css";
import "@/app/home-dashboard.css";

const pageTitle = "Investors — sourced notable gold & silver positions | GoldSignal";
const pageDescription =
  "Notable gold and silver positions held by leading investors and funds — sourced from SEC filings and public statements.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://goldsignal.ai/investors" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/investors",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

/** ISR: list sorted by most recent portfolio update at query layer. */
export const revalidate = 3600;

export default async function InvestorsPage() {
  const investors = await getPublishedInvestorsList();

  return (
    <main className="funds-page">
      <header className="funds-hero funds-hero--investors">
        <div className="funds-hero__inner">
          <h1 className="funds-hero__title funds-hero__title--investors">
            The Smart Money in Gold and Silver
          </h1>
          <p className="funds-hero__sub funds-hero__sub--investors">
            Precious metal portfolio managers, funds and family offices.
            <br />
            Data sourced from SEC filings and public statements
          </p>
        </div>
      </header>
      <div className="funds-main funds-main--investors">
        <p className="funds-filter-note funds-filter-note--investors">
          Notable gold &amp; silver positions held by leading investors and funds — sourced from SEC filings and
          public statements. Not complete portfolios.
        </p>
        <InvestorsList investors={investors} />
        <PageCompliance />
      </div>
    </main>
  );
}

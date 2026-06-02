import type { Metadata } from "next";
import { PageCompliance } from "@/components/layout/PageCompliance";
import { InvestorsList } from "@/components/investors/InvestorsList";
import { getPublishedInvestors, type InvestorSort } from "@/lib/investors/queries";
import { SITE_TAGLINE } from "@/lib/site";
import "@/app/funds.css";

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

export const revalidate = 3600;
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ sort?: string }>;

function parseSort(raw: string | undefined): InvestorSort {
  if (raw === "positions") return "positions";
  if (raw === "type") return "type";
  return "name";
}

export default async function InvestorsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const investors = await getPublishedInvestors(sort);

  return (
    <main className="funds-page">
      <header className="funds-hero">
        <div className="funds-hero__inner">
          <p className="funds-hero__eyebrow">Curated smart money</p>
          <h1 className="funds-hero__title">Tracked investors</h1>
          <p className="hero-tagline">{SITE_TAGLINE}</p>
          <p className="funds-hero__sub">{pageDescription}</p>
        </div>
      </header>
      <div className="funds-main">
        <p className="funds-filter-note">
          Notable gold &amp; silver positions held by leading investors and funds — sourced from SEC filings and
          public statements. Not complete portfolios.
        </p>
        <InvestorsList investors={investors} sort={sort} />
        <PageCompliance />
      </div>
    </main>
  );
}

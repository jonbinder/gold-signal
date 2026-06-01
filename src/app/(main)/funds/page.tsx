import type { Metadata } from "next";
import { PageCompliance } from "@/components/layout/PageCompliance";
import { FundsList } from "@/components/funds/FundsList";
import { getFundsList, type FundSort } from "@/lib/funds/queries";
import { SITE_TAGLINE } from "@/lib/site";
import "@/app/funds.css";

const pageTitle = "Precious-metals funds — 13F holdings | GoldSignal";
const pageDescription =
  "Precious-metals-focused funds and institutions — holdings sourced from their quarterly SEC 13F filings.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "https://goldsignal.ai/funds" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/funds",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export const revalidate = 3600;

type SearchParams = Promise<{ sort?: string }>;

function parseSort(raw: string | undefined): FundSort {
  if (raw === "pm-holdings") return "pm-holdings";
  return "name";
}

export default async function FundsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const funds = await getFundsList(sort);

  return (
    <main className="funds-page">
      <header className="funds-hero">
        <div className="funds-hero__inner">
          <p className="funds-hero__eyebrow">Institutional · 13F</p>
          <h1 className="funds-hero__title">Tracked funds</h1>
          <p className="hero-tagline">{SITE_TAGLINE}</p>
          <p className="funds-hero__sub">{pageDescription}</p>
        </div>
      </header>
      <div className="funds-main">
        <FundsList funds={funds} sort={sort} />
        <PageCompliance />
      </div>
    </main>
  );
}

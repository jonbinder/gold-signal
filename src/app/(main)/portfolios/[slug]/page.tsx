import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvestorDetailView } from "@/components/investors/InvestorDetailView";
import { getInvestorDetail } from "@/lib/investors/queries";
import "@/app/funds.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const model = await getInvestorDetail(slug);
  if (!model) return { title: "Portfolio not found — GoldSignal.ai" };
  const title = `${model.investor.name} — notable sourced positions | GoldSignal`;
  const description = `Notable sourced gold and silver positions for ${model.investor.name}, from SEC filings and public statements.`;
  return {
    title,
    description,
    alternates: { canonical: `https://goldsignal.ai/portfolios/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://goldsignal.ai/portfolios/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export const revalidate = 3600;

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const model = await getInvestorDetail(slug);
  if (!model) notFound();
  return <InvestorDetailView model={model} />;
}

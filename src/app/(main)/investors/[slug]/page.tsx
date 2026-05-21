import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvestorProfileView } from "@/components/investors/InvestorProfileView";
import { getInvestorProfileBySlug, getInvestors } from "@/lib/investors-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getInvestors().map((inv) => ({ slug: inv.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const investor = getInvestorProfileBySlug(slug);
  return {
    title: investor ? `${investor.displayName} — GoldSignal.ai` : "Investor — GoldSignal.ai",
  };
}

export default async function InvestorDetailPage({ params }: Props) {
  const { slug } = await params;
  const investor = getInvestorProfileBySlug(slug);
  if (!investor) notFound();

  return (
    <main>
      <InvestorProfileView investor={investor} />
    </main>
  );
}

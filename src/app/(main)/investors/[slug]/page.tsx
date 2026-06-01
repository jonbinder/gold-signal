import { redirect } from "next/navigation";
import { getFundConfigBySlug } from "@/lib/funds/config";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function InvestorDetailPage({ params }: Props) {
  const { slug } = await params;
  const fund = await getFundConfigBySlug(slug);
  redirect(fund ? `/funds/${slug}` : "/funds");
}

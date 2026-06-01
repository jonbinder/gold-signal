import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StockDetailView } from "@/components/stocks/StockDetailView";
import { getStockDetailPage } from "@/lib/stock-detail";
import { isTrackedTicker } from "@/lib/portfolio-universe";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";
import "../../../stock-detail.css";

export const revalidate = 3600;

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateStaticParams() {
  return loadTrackedStocksSync().map((s) => ({ ticker: s.ticker }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const upper = ticker.trim().toUpperCase();
  const model = await getStockDetailPage(upper);
  if (!model) {
    return { title: "Stock not found — GoldSignal.ai" };
  }

  const title = `${model.name} (${upper}): Insider Activity & Institutional Holdings — GoldSignal.ai`;
  const description = `Form 4 insider transactions, 13F institutional ownership, and company facts for ${model.name} (${upper}) — from public SEC filings.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://goldsignal.ai/stocks/${upper}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://goldsignal.ai/stocks/${upper}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function StockDetailPage({ params }: Props) {
  const { ticker } = await params;
  const sym = ticker.trim().toUpperCase();

  if (!(await isTrackedTicker(sym))) notFound();

  const model = await getStockDetailPage(sym);
  if (!model) notFound();

  return <StockDetailView model={model} />;
}

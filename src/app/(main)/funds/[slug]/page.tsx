import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCompliance } from "@/components/layout/PageCompliance";
import { FundHoldingsTable } from "@/components/funds/FundHoldingsTable";
import { getFundDetail } from "@/lib/funds/queries";
import { loadTrackedStocksSync } from "@/lib/tracked-stocks-load";
import "@/app/funds.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fund = await getFundDetail(slug);
  if (!fund) return { title: "Fund not found — GoldSignal.ai" };

  const title = `${fund.config.display_name} — 13F holdings | GoldSignal`;
  const description = `Quarterly SEC 13F holdings for ${fund.config.display_name}. ${fund.config.focus_note}`;

  return {
    title,
    description,
    alternates: { canonical: `https://goldsignal.ai/funds/${slug}` },
    openGraph: { title, description, type: "website", url: `https://goldsignal.ai/funds/${slug}` },
    twitter: { card: "summary", title, description },
  };
}

export const revalidate = 3600;

function formatPeriodEnd(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function FundDetailPage({ params }: Props) {
  const { slug } = await params;
  const fund = await getFundDetail(slug);
  if (!fund) notFound();

  const { config, holdings, periodLabel, periodEnd } = fund;
  const linkableTickers = new Set(loadTrackedStocksSync().map((s) => s.ticker));
  const asOf =
    periodLabel && periodEnd
      ? `${periodLabel} (period ended ${formatPeriodEnd(periodEnd)})`
      : periodLabel ?? null;

  return (
    <main className="funds-page">
      <header className="funds-hero">
        <div className="funds-hero__inner">
          <Link href="/funds" className="funds-back" style={{ color: "#94a3b8" }}>
            ← All funds
          </Link>
          <p className="funds-hero__eyebrow">13F filer</p>
          <h1 className="funds-hero__title">{config.display_name}</h1>
          {config.manager_name ? (
            <p className="funds-hero__sub" style={{ marginBottom: "0.35rem" }}>
              {config.manager_name}
            </p>
          ) : null}
          {config.focus_note ? <p className="funds-hero__sub">{config.focus_note}</p> : null}
          {config.website ? (
            <p className="funds-hero__sub" style={{ marginTop: "0.5rem" }}>
              <a href={config.website} target="_blank" rel="noopener noreferrer">
                {config.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          ) : null}
        </div>
      </header>

      <div className="funds-main">
        <div className="funds-detail-header">
          <p className="funds-detail-header__asof">
            {asOf ? `Holdings as of ${asOf} (13F)` : "Holdings as of latest filed quarter (13F)"}
          </p>
        </div>

        <div className="funds-teaching" data-snippet-key="fund_13f_lag">
          <span className="funds-teaching__label">Why this matters</span>
          SEC Form 13F is filed within 45 days of quarter-end. Positions shown here reflect what the
          fund reported at period end — not live trading. Use alongside Form 4 insider data on individual
          stocks.
        </div>

        {holdings.length === 0 ? (
          <p className="funds-empty">
            Latest filing pending — run <code>npm run sync:funds</code> after adding this fund&apos;s CIK
            to <code>data/funds.json</code>, or check back after the next quarterly 13F is filed.
          </p>
        ) : (
          <FundHoldingsTable holdings={holdings} linkableTickers={linkableTickers} />
        )}
        <PageCompliance />
      </div>
    </main>
  );
}

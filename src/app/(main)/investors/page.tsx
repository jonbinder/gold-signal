import type { Metadata } from "next";
import Link from "next/link";
import { InvestorAvatar } from "@/components/InvestorAvatar";
import { getInvestors } from "@/lib/goldsignal/data";
import { investorDisplayName } from "@/lib/investor-display-name";

export const metadata: Metadata = {
  title: "Investors — GoldSignal.ai",
  description:
    "Famous gold and silver investors tracked on GoldSignal.ai — portfolios, theses, and precious metals holdings.",
};

export default function InvestorsPage() {
  const investors = getInvestors();

  return (
    <main className="investors-page">
      <section className="investors" id="investors">
        <header className="section-header investors-page-header">
          <span className="investor-count-badge">{investors.length} investors</span>
          <h1 className="section-header__title">Famous Investors</h1>
          <p className="section-header__sub">
            Track where the smartest money in precious metals is positioned — curated from public
            filings, interviews, and disclosures.
          </p>
        </header>

        <div className="investors-list-mobile">
          {investors.map((investor) => (
            <Link
              key={investor.slug}
              href={`/investors/${investor.slug}`}
              className="investor-card-mobile"
            >
              <InvestorAvatar
                slug={investor.slug}
                name={investor.name}
                size={52}
                className="investor-card-mobile__avatar"
              />
              <div className="investor-info">
                <p className="investor-name">{investorDisplayName(investor.name, investor.sheetName)}</p>
                <p className="investor-role">{investor.role || investor.sheetName}</p>
                <div className="investor-tickers">
                  {investor.tickers.slice(0, 4).map((ticker) => (
                    <span key={ticker} className="ticker-chip mono">
                      {ticker}
                    </span>
                  ))}
                </div>
              </div>
              <span className="investor-chevron" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </div>

        <div className="investors__grid investors__grid--desktop">
          {investors.map((investor) => (
            <article key={investor.slug} className="investor-card fade-in visible">
              <InvestorAvatar slug={investor.slug} name={investor.name} size={48} className="investor-card__avatar" />
              <h2 className="investor-card__name">
                <Link href={`/investors/${investor.slug}`}>{investor.name}</Link>
              </h2>
              <p className="investor-card__role">{investor.role || investor.sheetName}</p>
              {investor.thesis ? <p className="investor-card__thesis">{investor.thesis}</p> : null}
              <div className="investor-card__tickers">
                {investor.tickers.slice(0, 5).map((ticker) => (
                  <span key={ticker} className="pill mono">
                    {ticker}
                  </span>
                ))}
              </div>
              <p className="investor-card__meta mono">
                {investor.positionCount} positions
                {investor.aum ? ` · ${investor.aum}` : ""}
              </p>
              <Link
                href={`/investors/${investor.slug}`}
                className="btn btn--secondary investor-card__cta"
              >
                View portfolio
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

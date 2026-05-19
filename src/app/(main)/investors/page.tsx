import type { Metadata } from "next";
import Link from "next/link";
import { getInvestors, investorInitials } from "@/lib/goldsignal/data";

export const metadata: Metadata = {
  title: "Investors — GoldSignal.ai",
  description:
    "Famous gold and silver investors tracked on GoldSignal.ai — portfolios, theses, and precious metals holdings.",
};

export default function InvestorsPage() {
  const investors = getInvestors();

  return (
    <main>
      <section className="investors" id="investors">
        <header className="section-header">
          <h1 className="section-header__title">Famous Investors</h1>
          <p className="section-header__sub">
            Track where the smartest money in precious metals is positioned — curated from public
            filings, interviews, and disclosures. Updated from{" "}
            <span className="mono">GoldSignal_Investors.xlsx</span>.
          </p>
        </header>
        <div className="investors__grid">
          {investors.map((investor) => (
            <article key={investor.slug} className="investor-card fade-in visible">
              <div className="investor-card__avatar mono" aria-hidden="true">
                {investorInitials(investor.name)}
              </div>
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

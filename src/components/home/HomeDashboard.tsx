import Link from "next/link";
import { InvestorPhoto } from "@/components/InvestorPhoto";
import { StockLogo } from "@/components/stocks/StockLogo";
import { WatchlistCaptureForm } from "@/components/home/WatchlistCaptureForm";
import { investorPath, stockPath } from "@/lib/paths";
import type { HomeDashboardModel, HomePopularInvestorRow } from "@/lib/home/types";

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`home-panel ${className}`.trim()}>
      <h2 className="home-panel__title">{title}</h2>
      {children}
    </section>
  );
}

function PopularPortfolioRow({ row }: { row: HomePopularInvestorRow }) {
  const stockLabel = `${row.stockCount} Stock${row.stockCount === 1 ? "" : "s"}`;

  return (
    <li className="home-portfolio-row">
      <InvestorPhoto investor={{ name: row.name, slug: row.slug }} size="thumb" />
      <div className="home-portfolio-row__body">
        <Link href={investorPath(row.slug)} className="home-portfolio-row__name">
          {row.name}
        </Link>
        <p className="home-portfolio-row__firm">{row.firm}</p>
        <Link href={investorPath(row.slug)} className="home-portfolio-row__stocks">
          {stockLabel}
        </Link>
      </div>
    </li>
  );
}

export function HomeDashboard({ model }: { model: HomeDashboardModel }) {
  const showColumns = model.panels.popularPortfolios || model.panels.mostHeld;

  return (
    <>
      <header className="home-masthead home-masthead--compact" aria-label="GoldSignal overview">
        <div className="home-masthead__inner home-masthead__inner--solo">
          <h1 className="home-masthead__title">Invest like an insider</h1>
          <p className="home-masthead__desc">
            SEC Form 4 Insider Transactions and Portfolio Tracking
          </p>
        </div>
      </header>

      <div className="home-dashboard">
        {showColumns ? (
          <div className="home-dashboard__grid home-dashboard__grid--portfolios">
            {model.panels.popularPortfolios ? (
              <Panel title="Most Popular Portfolios" className="home-panel--featured home-panel--portfolios">
                <ul className="home-portfolio-list">
                  {model.popularPortfolios.map((row) => (
                    <PopularPortfolioRow key={row.slug} row={row} />
                  ))}
                </ul>
              </Panel>
            ) : (
              <Panel title="Most Popular Portfolios" className="home-panel--featured home-panel--portfolios">
                <p className="home-feed__empty">Published investor portfolios will appear here.</p>
              </Panel>
            )}

            {model.panels.mostHeld ? (
              <Panel title="Most-held stocks" className="home-panel--featured">
                <ol className="home-panel-list home-panel-list--ranked">
                  {model.mostHeld.map((row) => (
                    <li key={row.ticker} className="home-panel-list__item">
                      <Link href={stockPath(row.ticker)} className="home-panel-list__link home-panel-list__link--with-logo">
                        <StockLogo
                          ticker={row.ticker}
                          logoUrl={row.logoUrl}
                          tryServe
                          subCategory={row.subCategory}
                          size={30}
                        />
                        <span className="home-panel-list__link-text">
                          <span className="home-panel-list__primary mono">{row.ticker}</span>
                          <span className="home-panel-list__secondary">
                            held by {row.holderCount} tracked investor
                            {row.holderCount === 1 ? "" : "s"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </Panel>
            ) : null}
          </div>
        ) : null}

        <section className="home-capture-band" aria-labelledby="home-capture-heading">
          <div className="home-capture-band__inner">
            <h2 id="home-capture-heading" className="home-capture-band__title">
              Get the free readout — your tickers, the filings decoded
            </h2>
            <p className="home-capture-band__sub">
              Weekly-style snapshot of Form 4, 13F, and large-stake context for the names you follow.
            </p>
            <WatchlistCaptureForm variant="footer" />
          </div>
        </section>
      </div>
    </>
  );
}

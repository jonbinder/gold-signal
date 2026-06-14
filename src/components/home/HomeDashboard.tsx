import Link from "next/link";
import { HomePortfolioCard } from "@/components/home/HomePortfolioCard";
import { StockLogo } from "@/components/stocks/StockLogo";
import { WatchlistCaptureForm } from "@/components/home/WatchlistCaptureForm";
import { stockPath } from "@/lib/paths";
import type { HomeDashboardModel } from "@/lib/home/types";

const RECENT_PORTFOLIOS_TITLE = "Recently Updated Portfolios";

function Panel({
  title,
  children,
  className = "",
  ariaLabel,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <section className={`home-panel ${className}`.trim()} aria-label={ariaLabel ?? title}>
      <h2 className="home-panel__title home-portfolios__title">{title}</h2>
      {children}
    </section>
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
              <Panel
                title={RECENT_PORTFOLIOS_TITLE}
                ariaLabel={RECENT_PORTFOLIOS_TITLE}
                className="home-panel--featured home-panel--portfolios"
              >
                <div className="home-portfolio-grid">
                  {model.popularPortfolios.map((row, index) => (
                    <HomePortfolioCard key={row.slug} row={row} priorityPhoto={index < 3} />
                  ))}
                </div>
              </Panel>
            ) : (
              <Panel
                title={RECENT_PORTFOLIOS_TITLE}
                ariaLabel={RECENT_PORTFOLIOS_TITLE}
                className="home-panel--featured home-panel--portfolios"
              >
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

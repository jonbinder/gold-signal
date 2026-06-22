import Link from "next/link";
import { HomePortfolioTile } from "@/components/home/HomePortfolioTile";
import { SectionHeading } from "@/components/home/SectionHeading";
import { StockLogo } from "@/components/stocks/StockLogo";
import { stockPath } from "@/lib/paths";
import type { HomeDashboardModel } from "@/lib/home/types";

const HOME_STOCKS_CAP = 5;

export function HomeDashboard({ model }: { model: HomeDashboardModel }) {
  const portfolios = model.popularPortfolios.slice(0, 4);
  const stocks = model.mostHeld.slice(0, HOME_STOCKS_CAP);

  return (
    <div className="home-dashboard">
      <section className="home-section-card" aria-label="Portfolios">
        <SectionHeading
          title="Portfolios"
          href="/portfolios"
          subtitle="Most Popular Portfolios"
        />
        {portfolios.length > 0 ? (
          <div className="home-portfolio-tile-grid">
            {portfolios.map((row, index) => (
              <HomePortfolioTile key={row.slug} row={row} priorityPhoto={index < 4} />
            ))}
          </div>
        ) : (
          <p className="home-section-card__empty">Published investor portfolios will appear here.</p>
        )}
      </section>

      <section className="home-section-card" aria-label="Stocks">
        <SectionHeading title="Stocks" href="/stocks" subtitle="Most Popular" />
        {stocks.length > 0 ? (
          <ol className="home-panel-list home-panel-list--ranked home-stocks-list">
            {stocks.map((row) => (
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
        ) : (
          <p className="home-section-card__empty">Tracked stock holdings will appear here.</p>
        )}
      </section>
    </div>
  );
}

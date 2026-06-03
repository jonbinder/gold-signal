import Link from "next/link";
import { GoldWisdomQuote } from "@/components/home/GoldWisdomQuote";
import { WatchlistCaptureForm } from "@/components/home/WatchlistCaptureForm";
import { investorPath, stockPath } from "@/lib/paths";
import type { HomeDashboardModel, HomeInsiderRow } from "@/lib/home/types";

function InsiderFeedRow({ row }: { row: HomeInsiderRow }) {
  const sideClass =
    row.type === "BUY"
      ? "home-feed-row--buy"
      : row.type === "SELL"
        ? "home-feed-row--sell"
        : "home-feed-row--neutral";

  return (
    <li className={`home-feed-row ${sideClass}`}>
      <div className="home-feed-row__top">
        <div className="home-feed-row__identity">
          <Link href={stockPath(row.ticker)} className="home-feed-row__ticker mono">
            {row.ticker}
          </Link>
          <Link href={stockPath(row.ticker)} className="home-feed-row__company">
            {row.companyName}
          </Link>
        </div>
        <time className="home-feed-row__date mono" dateTime={row.dateIso}>
          {row.dateLabel}
        </time>
      </div>
      <p className="home-feed-row__detail">
        <span className="home-feed-row__side">{row.type === "BUY" ? "Buy" : "Sell"}</span>
        <span className="home-feed-row__sep">·</span>
        <span>{row.sizeLabel}</span>
        {row.insiderLabel ? (
          <>
            <span className="home-feed-row__sep">·</span>
            <span>{row.insiderLabel}</span>
          </>
        ) : null}
      </p>
    </li>
  );
}

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

export function HomeDashboard({ model }: { model: HomeDashboardModel }) {
  const showSidePanels =
    model.panels.mostHeld ||
    model.panels.biggestPositions ||
    model.panels.recentInvestors ||
    model.panels.topInsiderBuys;

  return (
    <>
      <header className="home-masthead" aria-label="GoldSignal overview">
        <div className="home-masthead__inner">
          <div className="home-masthead__lead">
            <h1 className="home-masthead__title">The smart money in gold &amp; silver</h1>
            <p className="home-masthead__desc">
              Recent SEC Form 4 insider trades and tracked investor holdings across our precious-metals
              stock universe — sourced from public filings.
            </p>
          </div>
          <div className="home-masthead__quote-slot">
            <GoldWisdomQuote />
          </div>
        </div>
      </header>

      <div className="home-dashboard">
        <div className="home-dashboard__grid">
          <section className="home-feed" aria-labelledby="home-insider-heading">
            <h2 id="home-insider-heading" className="home-feed__title">
              Recent Insider Activity
            </h2>
            {model.insiderFeed.length === 0 ? (
              <p className="home-feed__empty">
                {model.insiderFeedNote ??
                  "No recent Form 4 activity on file yet for the tracked universe."}
              </p>
            ) : (
              <>
                <ul className="home-feed__list">
                  {model.insiderFeed.map((row) => (
                    <InsiderFeedRow key={row.id} row={row} />
                  ))}
                </ul>
                {model.insiderFeedNote ? (
                  <p className="home-feed__note">{model.insiderFeedNote}</p>
                ) : null}
              </>
            )}
          </section>

          {showSidePanels ? (
            <aside className="home-panels" aria-label="Market intelligence panels">
              {model.panels.mostHeld ? (
                <Panel title="Most-held stocks" className="home-panel--featured">
                  <ol className="home-panel-list home-panel-list--ranked">
                    {model.mostHeld.map((row) => (
                      <li key={row.ticker} className="home-panel-list__item">
                        <Link href={stockPath(row.ticker)} className="home-panel-list__link">
                          <span className="home-panel-list__primary mono">{row.ticker}</span>
                          <span className="home-panel-list__secondary">
                            held by {row.holderCount} tracked investor
                            {row.holderCount === 1 ? "" : "s"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </Panel>
              ) : null}

              {model.panels.biggestPositions ? (
                <Panel title="Biggest tracked positions">
                  <ul className="home-panel-list">
                    {model.biggestPositions.map((row) => (
                      <li key={`${row.investorSlug}-${row.ticker}`} className="home-panel-list__item">
                        <p className="home-panel-list__row">
                          <Link href={investorPath(row.investorSlug)} className="home-panel-list__investor">
                            {row.investorName}
                          </Link>
                          <span className="home-panel-list__sep">→</span>
                          <Link href={stockPath(row.ticker)} className="home-panel-list__primary mono">
                            {row.ticker}
                          </Link>
                        </p>
                        <p className="home-panel-list__meta">{row.sizeLabel}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}

              {model.panels.recentInvestors ? (
                <Panel title="Recently updated investors">
                  <ul className="home-panel-list">
                    {model.recentInvestors.map((row) => (
                      <li key={row.slug} className="home-panel-list__item">
                        <Link href={investorPath(row.slug)} className="home-panel-list__link">
                          <span className="home-panel-list__primary">{row.name}</span>
                          {row.updatedLabel ? (
                            <span className="home-panel-list__secondary mono">{row.updatedLabel}</span>
                          ) : null}
                        </Link>
                        <p className="home-panel-list__meta">{row.subtitle}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}

              {model.panels.topInsiderBuys ? (
                <Panel title="Largest insider buys">
                  <ul className="home-panel-list">
                    {model.topInsiderBuys.map((row) => (
                      <li key={`buy-${row.id}`} className="home-panel-list__item home-panel-list__item--buy">
                        <Link href={stockPath(row.ticker)} className="home-panel-list__link">
                          <span className="home-panel-list__primary mono">{row.ticker}</span>
                          <span className="home-panel-list__secondary">{row.sizeLabel}</span>
                        </Link>
                        <p className="home-panel-list__meta">{row.insiderLabel}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </aside>
          ) : null}
        </div>

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

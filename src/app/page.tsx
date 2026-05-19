import type { Metadata } from "next";
import GoldSignalClient from "./components/GoldSignalClient";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  name: "GoldSignal.ai",
  description:
    "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios, and more.",
  url: "https://goldsignal.ai/",
};

export const metadata: Metadata = {
  title: "GoldSignal.ai — Gold & Silver Stock Rankings Powered by AI",
  description:
    "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios, and more.",
  alternates: {
    canonical: "https://goldsignal.ai/",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23C9971C'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "GoldSignal.ai — Gold & Silver Stock Rankings Powered by AI",
    description:
      "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios, and more.",
    type: "website",
    url: "https://goldsignal.ai/",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. Sticky navigation */}
      <nav className="nav" id="nav" aria-label="Main">
        <a href="#" className="nav__logo">
          Gold<span className="nav__logo-accent">Signal</span>.ai
        </a>
        <ul className="nav__links">
          <li>
            <a href="#rankings">Rankings</a>
          </li>
          <li>
            <a href="#investors">Investors</a>
          </li>
          <li>
            <a href="#signalscore">SignalScore</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
        </ul>
        <a href="#portfolio-review" className="btn btn--cta nav__cta">
          Free Portfolio Review
        </a>
      </nav>

      <main>
        {/* 2. Hero */}
        <section className="hero" id="about">
          <div className="hero__content">
            <p className="hero__eyebrow">Powered by 13F · Insider · PE · Forward PE</p>
            <h1 className="hero__title">
              Rank <em>gold &amp; silver</em> stocks with institutional-grade intelligence
            </h1>
            <p className="hero__sub">
              GoldSignal.ai scores every major precious metals stock from 0–100 using proprietary
              SignalScore — built on 13F filings, insider activity, valuation ratios, and famous
              investor portfolios.
            </p>
            <div className="hero__actions">
              <a href="#rankings" className="btn btn--primary">
                View Rankings
              </a>
              <a href="#portfolio-review" className="btn btn--secondary">
                Free Portfolio Review
              </a>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-value mono">120+</span>
                <span className="hero__stat-label">Stocks ranked</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value mono">13F</span>
                <span className="hero__stat-label">Filing data</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value mono">24h</span>
                <span className="hero__stat-label">Portfolio review</span>
              </div>
            </div>
          </div>
          <aside className="score-card" aria-label="Live sample rankings">
            <div className="score-card__header">
              <span className="score-card__label mono">SignalScore Live</span>
              <span className="score-card__pulse" aria-hidden="true" />
            </div>
            <ul className="score-card__list" id="score-card-list" />
          </aside>
        </section>

        {/* 3. Famous Investors */}
        <section className="investors" id="investors">
          <header className="section-header">
            <h2 className="section-header__title">Famous Investors</h2>
            <p className="section-header__sub">
              Track where the smartest money in precious metals is positioned — updated from latest
              13F disclosures.
            </p>
          </header>
          <div className="investors__grid" id="investors-grid" />
        </section>

        {/* 4. Stock Rankings */}
        <section className="rankings" id="rankings">
          <header className="section-header section-header--dark">
            <h2 className="section-header__title">Stock Rankings</h2>
            <p className="section-header__sub">
              Gold &amp; silver equities ranked by SignalScore — refreshed weekly from institutional
              filings and market data.
            </p>
          </header>
          <div className="rankings__table-wrap">
            <table className="rankings-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Ticker</th>
                  <th scope="col">Company</th>
                  <th scope="col">Sector</th>
                  <th scope="col">Weekly</th>
                  <th scope="col">SignalScore</th>
                </tr>
              </thead>
              <tbody id="rankings-tbody" />
            </table>
            <div className="email-gate lock-row" id="email-gate">
              <div className="email-gate__panel">
                <h3 className="email-gate__title">Unlock the full rankings</h3>
                <p className="email-gate__text">
                  Get access to all 120+ gold &amp; silver stocks ranked by SignalScore.
                </p>
                <form className="email-gate__form" id="gate-form" noValidate>
                  <label className="sr-only" htmlFor="gate-email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="gate-email"
                    name="email"
                    placeholder="you@email.com"
                    required
                    autoComplete="email"
                  />
                  <button type="submit" className="btn btn--unlock">
                    Unlock Full List
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SignalScore Explained */}
        <section className="explained" id="signalscore">
          <header className="section-header">
            <h2 className="section-header__title">SignalScore Explained</h2>
            <p className="section-header__sub">
              A proprietary 0–100 composite score synthesizing institutional conviction, insider
              behavior, valuation, and smart-money overlap.
            </p>
          </header>
          <div className="explained__grid">
            <aside className="explained__score-panel">
              <p className="explained__score-label">Sample composite</p>
              <div className="explained__score-header">
                <p className="explained__score-value">87</p>
                <span className="explained__rating-badge">Strong Conviction</span>
              </div>
              <ul className="sub-scores">
                <li className="sub-score">
                  <span className="sub-score__label">13F Institutional Conviction</span>
                  <span className="mono sub-score__value">92</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: "92%" }} />
                  </span>
                </li>
                <li className="sub-score">
                  <span className="sub-score__label">Insider Buying vs Selling</span>
                  <span className="mono sub-score__value">88</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: "88%" }} />
                  </span>
                </li>
                <li className="sub-score">
                  <span className="sub-score__label">PE Ratio</span>
                  <span className="mono sub-score__value">79</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: "79%" }} />
                  </span>
                </li>
                <li className="sub-score">
                  <span className="sub-score__label">Forward PE Ratio</span>
                  <span className="mono sub-score__value">84</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: "84%" }} />
                  </span>
                </li>
                <li className="sub-score">
                  <span className="sub-score__label">Famous Investor Overlap</span>
                  <span className="mono sub-score__value">91</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: "91%" }} />
                  </span>
                </li>
                <li className="sub-score">
                  <span className="sub-score__label">Sector Momentum</span>
                  <span className="mono sub-score__value">86</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: "86%" }} />
                  </span>
                </li>
              </ul>
            </aside>
            <ol className="explained__metrics">
              <li className="metric fade-in">
                <span className="metric__num mono">01</span>
                <div>
                  <h3 className="metric__title">Institutional 13F Data</h3>
                  <p className="metric__desc">
                    We parse quarterly SEC 13F filings to measure net institutional accumulation,
                    position concentration, and quarter-over-quarter changes across the top 500
                    holders.
                  </p>
                </div>
              </li>
              <li className="metric fade-in">
                <span className="metric__num mono">02</span>
                <div>
                  <h3 className="metric__title">Insider Buying vs Selling</h3>
                  <p className="metric__desc">
                    Form 4 insider transactions are weighted by recency and dollar size — net
                    buying boosts the score; clustered selling or option exercises reduce it.
                  </p>
                </div>
              </li>
              <li className="metric fade-in">
                <span className="metric__num mono">03</span>
                <div>
                  <h3 className="metric__title">PE Ratio Analysis</h3>
                  <p className="metric__desc">
                    Trailing PE is benchmarked against sector medians and historical ranges for each
                    issuer, rewarding stocks trading below fair value on earnings.
                  </p>
                </div>
              </li>
              <li className="metric fade-in">
                <span className="metric__num mono">04</span>
                <div>
                  <h3 className="metric__title">Forward PE Projection</h3>
                  <p className="metric__desc">
                    Consensus forward PE captures analyst expectations — we score stocks where
                    forward multiples imply upside relative to peers and gold price scenarios.
                  </p>
                </div>
              </li>
              <li className="metric fade-in">
                <span className="metric__num mono">05</span>
                <div>
                  <h3 className="metric__title">Famous Investor Portfolio Tracking</h3>
                  <p className="metric__desc">
                    Overlap with disclosed holdings of Eric Sprott, Peter Schiff, Rick Rule, John
                    Hathaway, and other tracked precious-metals specialists adds a conviction layer
                    to every rank.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* 6. Free Portfolio Review */}
        <section className="portfolio-review" id="portfolio-review">
          <header className="section-header section-header--center">
            <h2 className="section-header__title">Free Portfolio Review</h2>
            <p className="section-header__sub">
              Submit your holdings and receive a personalized SignalScore breakdown for each
              position.
            </p>
          </header>
          <form className="portfolio-form" id="portfolio-form" noValidate>
            <div className="portfolio-form__card">
              <div className="portfolio-form__row">
                <label className="portfolio-form__field">
                  <span className="portfolio-form__label">Name</span>
                  <input
                    type="text"
                    name="name"
                    id="review-name"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
                <label className="portfolio-form__field">
                  <span className="portfolio-form__label">Email</span>
                  <input
                    type="email"
                    name="email"
                    id="review-email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                  />
                </label>
              </div>
              <label className="portfolio-form__field portfolio-form__field--full">
                <span className="portfolio-form__label">Tickers in your portfolio</span>
                <textarea
                  name="tickers"
                  id="review-tickers"
                  rows={4}
                  placeholder="NEM, FNV, WPM, AG…"
                  required
                />
              </label>
              <button type="submit" className="btn btn--submit btn--full">
                Submit for Review
              </button>
              <p className="portfolio-form__note">
                You will receive your SignalScore report by email within 24 hours
              </p>
            </div>
          </form>
        </section>

        <GoldSignalClient />
      </main>

      {/* 7. Footer */}
      <footer className="footer">
        <a href="#" className="footer__logo">
          Gold<span className="nav__logo-accent">Signal</span>.ai
        </a>
        <p className="footer__source">
          Data sourced from SEC EDGAR 13F/Form 4 filings, exchange feeds, and consensus estimates.
          Not investment advice.
        </p>
        <p className="footer__copy mono">&copy; 2026 GoldSignal.ai. All rights reserved.</p>
      </footer>

    </>
  );
}

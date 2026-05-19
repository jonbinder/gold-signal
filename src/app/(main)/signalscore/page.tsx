import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SignalScore — GoldSignal.ai",
  description:
    "How GoldSignal.ai calculates the 0–100 SignalScore for gold and silver stocks using 13F, insider, and valuation data.",
};

export default function SignalScorePage() {
  return (
    <main>
      <section className="explained" id="signalscore">
        <header className="section-header">
          <h1 className="section-header__title">SignalScore Explained</h1>
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
            <li className="metric fade-in visible">
              <span className="metric__num mono">01</span>
              <div>
                <h2 className="metric__title">Institutional 13F Data</h2>
                <p className="metric__desc">
                  We parse quarterly SEC 13F filings to measure net institutional accumulation,
                  position concentration, and quarter-over-quarter changes across the top 500
                  holders.
                </p>
              </div>
            </li>
            <li className="metric fade-in visible">
              <span className="metric__num mono">02</span>
              <div>
                <h2 className="metric__title">Insider Buying vs Selling</h2>
                <p className="metric__desc">
                  Form 4 insider transactions are weighted by recency and dollar size — net buying
                  boosts the score; clustered selling or option exercises reduce it.
                </p>
              </div>
            </li>
            <li className="metric fade-in visible">
              <span className="metric__num mono">03</span>
              <div>
                <h2 className="metric__title">PE Ratio Analysis</h2>
                <p className="metric__desc">
                  Trailing PE is benchmarked against sector medians and historical ranges for each
                  issuer, rewarding stocks trading below fair value on earnings.
                </p>
              </div>
            </li>
            <li className="metric fade-in visible">
              <span className="metric__num mono">04</span>
              <div>
                <h2 className="metric__title">Forward PE Projection</h2>
                <p className="metric__desc">
                  Consensus forward PE captures analyst expectations — we score stocks where forward
                  multiples imply upside relative to peers and gold price scenarios.
                </p>
              </div>
            </li>
            <li className="metric fade-in visible">
              <span className="metric__num mono">05</span>
              <div>
                <h2 className="metric__title">Famous Investor Portfolio Tracking</h2>
                <p className="metric__desc">
                  Overlap with disclosed holdings of tracked precious-metals specialists — including
                  profiles on our{" "}
                  <Link href="/investors">Investors</Link> page — adds a conviction layer to every
                  rank.
                </p>
              </div>
            </li>
            <li className="metric fade-in visible">
              <span className="metric__num mono">06</span>
              <div>
                <h2 className="metric__title">Monthly Price Momentum</h2>
                <p className="metric__desc">
                  Recent monthly performance helps flag improving tape action alongside fundamental
                  scores. See live rankings on the <Link href="/stocks">Stocks</Link> page.
                </p>
              </div>
            </li>
          </ol>
        </div>
        <p className="explained__back">
          <Link href="/stocks" className="btn btn--primary">
            View stock rankings
          </Link>
        </p>
      </section>
    </main>
  );
}

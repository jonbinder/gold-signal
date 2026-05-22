import { MetricIcon } from "@/components/signalscore/MetricIcon";

const SIGNAL_PILLS = [
  { icon: "ti-building-bank", label: "Institutional 13F Data" },
  { icon: "ti-user-dollar", label: "Insider Buying vs Selling" },
  { icon: "ti-chart-bar", label: "PE Ratio Analysis" },
  { icon: "ti-trending-up", label: "Forward PE Projection" },
  { icon: "ti-star", label: "Famous Investor Tracking" },
  { icon: "ti-chart-line", label: "52-Week Support Level" },
  { icon: "ti-coins", label: "Gold Price Correlation" },
  { icon: "ti-target", label: "Analyst Price Target Upside" },
  { icon: "ti-microphone", label: "Executive Commentary Signal" },
] as const;

const WEIGHT_BARS = [
  {
    label: "Primary signals",
    note: "(institutional, insider, famous investor, executive commentary)",
    width: "100%",
  },
  {
    label: "Valuation signals",
    note: "(PE ratio, forward PE, analyst targets)",
    width: "68%",
  },
  {
    label: "Confirming signals",
    note: "(52-week support, gold correlation)",
    width: "42%",
  },
] as const;

function ConnectorHorizontal() {
  return (
    <div className="ss-hero__connector ss-hero__connector--horizontal" aria-hidden="true">
      <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
        <line x1="0" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="1" />
        <path d="M22 2L26 6L22 10" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

function ConnectorVertical() {
  return (
    <div className="ss-hero__connector ss-hero__connector--vertical" aria-hidden="true">
      <svg width="12" height="28" viewBox="0 0 12 28" fill="none">
        <line x1="6" y1="0" x2="6" y2="22" stroke="currentColor" strokeWidth="1" />
        <path d="M2 22L6 26L10 22" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

export function SignalScoreHero() {
  return (
    <header className="ss-hero">
      <h1 className="ss-hero__title">What is the SignalScore?</h1>
      <p className="ss-hero__subhead">
        A single number from 0 to 100 that tells you how much conviction the smartest money in the
        gold market has in a stock right now.
      </p>
      <p className="ss-hero__body">
        We track nine separate data sources for every stock we cover, from what major institutions
        are buying to what company executives are saying on earnings calls. Each one is scored
        individually, then combined using a weighted formula that reflects how predictive each
        signal has historically been. The result is the SignalScore: one number that does the work
        of nine.
      </p>

      <div className="ss-hero__diagram" aria-label="From 9 signals to 1 score">
        <div className="ss-hero__diagram-flow">
          <div className="ss-hero__col">
            <p className="ss-hero__col-label">The 9 signals</p>
            <ul className="ss-hero__pills">
              {SIGNAL_PILLS.map((pill) => (
                <li key={pill.label} className="ss-hero__pill">
                  <MetricIcon name={pill.icon} className="ss-hero__pill-icon" />
                  <span>{pill.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <ConnectorVertical />
          <ConnectorHorizontal />

          <div className="ss-hero__col">
            <p className="ss-hero__col-label">Weighted formula</p>
            <div className="ss-hero__weights">
              {WEIGHT_BARS.map((bar) => (
                <div key={bar.label} className="ss-hero__weight-row">
                  <div className="ss-hero__weight-head">
                    <span className="ss-hero__weight-label">{bar.label}</span>
                    <span className="ss-hero__weight-note">{bar.note}</span>
                  </div>
                  <div className="ss-hero__weight-track">
                    <span className="ss-hero__weight-fill" style={{ width: bar.width }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="ss-hero__weights-disclaimer">
              Exact weights are proprietary. The hierarchy reflects historical predictive value.
            </p>
          </div>

          <ConnectorVertical />
          <ConnectorHorizontal />

          <div className="ss-hero__col ss-hero__col--result">
            <p className="ss-hero__col-label">The result</p>
            <div className="ss-hero__result">
              <div className="ss-hero__score-circle">
                <span className="ss-hero__score-value mono">83</span>
              </div>
              <p className="ss-hero__score-name mono">SignalScore</p>
              <p className="ss-hero__score-tier">Strong conviction</p>
            </div>
          </div>
        </div>
        <p className="ss-hero__diagram-footnote">
          Every score updates on a rolling basis as new filings, price data, and transcripts become
          available.
        </p>
      </div>
    </header>
  );
}

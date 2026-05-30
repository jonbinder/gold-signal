import { MetricIcon } from "@/components/signalscore/MetricIcon";

const FOOTPRINT_PILLS = [
  { icon: "ti-user-dollar", label: "Insider Buying vs Selling" },
  { icon: "ti-building-bank", label: "Institutional 13F Data" },
  { icon: "ti-star", label: "Famous Investor Tracking" },
] as const;

const WEIGHT_BARS = [
  {
    label: "Insider activity",
    note: "Highest emphasis — personal capital at risk",
    width: "100%",
  },
  {
    label: "Institutional 13F",
    note: "Strong emphasis — quarterly smart-money footprint",
    width: "72%",
  },
  {
    label: "Famous investor holdings",
    note: "Meaningful emphasis — sector specialists we track",
    width: "58%",
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
        gold market has in a stock right now — gently adjusted for how hard that stock moves when
        gold moves.
      </p>
      <p className="ss-hero__body">
        We combine three smart-money footprint signals into a base score, then apply a gentle
        gold-torque multiplier. The footprints tell you where the conviction is; the torque tells
        you how much leverage the stock has to the metal price. When a footprint is unavailable, it
        is excluded — we do not fill gaps with a neutral guess.
      </p>

      <p className="ss-hero__formula mono" aria-label="SignalScore formula">
        SignalScore = (Insider + Institutional + Famous Investor) × Gold Torque
      </p>

      <div className="ss-hero__diagram" aria-label="From three footprints and gold torque to one score">
        <div className="ss-hero__diagram-flow">
          <div className="ss-hero__col">
            <p className="ss-hero__col-label">Three footprints</p>
            <ul className="ss-hero__pills">
              {FOOTPRINT_PILLS.map((pill) => (
                <li key={pill.label} className="ss-hero__pill">
                  <MetricIcon name={pill.icon} className="ss-hero__pill-icon" />
                  <span>{pill.label}</span>
                </li>
              ))}
            </ul>
            <p className="ss-hero__col-caption">→ SmartMoneyBase (0–100)</p>
          </div>

          <ConnectorVertical />
          <ConnectorHorizontal />

          <div className="ss-hero__col">
            <p className="ss-hero__col-label">Gold torque multiplier</p>
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
            <p className="ss-hero__torque-note">
              × Gold Torque (~0.85–1.15) — beta vs GLD/SLV, universe-normalized, R²-gated
            </p>
            <p className="ss-hero__weights-disclaimer">
              Relative footprint emphasis reflects our view that real-money filings are the
              strongest evidence of conviction. Exact weights are proprietary.
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
              <p className="ss-hero__score-math mono">78 × 1.06 ≈ 83</p>
            </div>
          </div>
        </div>
        <p className="ss-hero__diagram-footnote">
          Scores refresh as new SEC filings and market data become available. Display scores are
          capped at 100; underlying values may rank slightly higher when torque is strong.
        </p>
      </div>
    </header>
  );
}

const REFRESH_ROWS = [
  { component: "Institutional 13F Data", cadence: "Quarterly, within 2 days of SEC filing deadline" },
  { component: "Insider Buying vs Selling", cadence: "Within 48 hours of Form 4 SEC filing" },
  { component: "PE Ratio Analysis", cadence: "Weekly, based on latest reported earnings" },
  { component: "Forward PE Projection", cadence: "Weekly, synced to analyst estimate revisions" },
  { component: "Famous Investor Portfolio Tracking", cadence: "Quarterly, upon 13F publication" },
  { component: "52-Week Support Level", cadence: "Daily, based on closing price" },
  { component: "Gold Price Correlation", cadence: "Daily, recalculates on market close" },
  { component: "Analyst Price Target Upside", cadence: "Weekly, as price targets are revised" },
  { component: "Executive Commentary Signal", cadence: "Within 72 hours of earnings call or investor day transcript" },
] as const;

const WEIGHT_TIERS = [
  {
    label: "Primary signals",
    detail: "Institutional 13F Data, Insider Buying vs Selling, Famous Investor Portfolio Tracking, Executive Commentary Signal",
    width: "100%",
  },
  {
    label: "Valuation signals",
    detail: "PE Ratio, Forward PE Projection, Analyst Price Target Upside",
    width: "68%",
  },
  {
    label: "Confirming signals",
    detail: "52-Week Support Level, Gold Price Correlation",
    width: "42%",
  },
] as const;

const CASE_STUDY_ROWS = [
  {
    factor: "Institutional 13F Data",
    score: 91,
    note: "Three of the top 20 gold-focused funds added to positions last quarter",
  },
  {
    factor: "Insider Buying vs Selling",
    score: 88,
    note: "CEO and two board members made open-market purchases in the past 45 days",
  },
  {
    factor: "PE Ratio Analysis",
    score: 64,
    note: "Trailing PE sits modestly above sector median, a small drag on the score",
  },
  {
    factor: "Forward PE Projection",
    score: 79,
    note: "Forward multiple implies meaningful upside if gold holds above current levels",
  },
  {
    factor: "Famous Investor Portfolio Tracking",
    score: 90,
    note: "Appears in the disclosed holdings of four tracked precious-metals specialists",
  },
  {
    factor: "52-Week Support Level",
    score: 77,
    note: "Trading 12% above its 52-week low, near a historically well-defended price level",
  },
  {
    factor: "Gold Price Correlation",
    score: 85,
    note: "Strong historical correlation, meaning shareholders get real leverage when gold moves",
  },
  {
    factor: "Analyst Price Target Upside",
    score: 82,
    note: "Consensus target implies 31% upside from current price across six covering analysts",
  },
  {
    factor: "Executive Commentary Signal",
    score: 74,
    note: "Recent earnings call flagged improved drill results but guidance language was cautious",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Can a stock score high and still decline in price?",
    answer:
      "Yes. The SignalScore reflects what the data shows at a point in time. It does not predict short-term price movements. A stock scoring 85 today could fall if gold prices drop sharply, if a major holder sells unexpectedly, or if earnings disappoint. The score is a measure of current signal quality, not a guarantee of future performance.",
  },
  {
    question: "How is this different from a stock screener?",
    answer:
      "Most screeners let you filter stocks by individual metrics like PE ratio or insider buying. The SignalScore combines nine factors into a single weighted number so you can compare stocks at a glance without having to interpret each data point yourself. It is designed specifically for the gold and silver mining sector, which means the benchmarks and thresholds are calibrated for this industry rather than applied generically across all stocks.",
  },
  {
    question: "What happens when the model is updated?",
    answer:
      "When we adjust component weights or add new data sources, all scores are recalculated from the same starting point so rankings remain comparable. We note any methodology changes on this page.",
  },
  {
    question: "What does it mean when insider and institutional signals disagree?",
    answer:
      "It means the stock deserves closer scrutiny. Institutions have broad research capabilities but manage large portfolios and may hold positions for reasons unrelated to near-term conviction. Insiders have direct knowledge of company operations but may sell for personal liquidity reasons. When these two signals point in opposite directions, we weight the direction of insider buying more heavily, since purchasing with personal capital is a stronger signal than maintaining an existing fund position.",
  },
] as const;

export function SignalScoreSupplement() {
  return (
    <div className="ss-supplement">
      <section className="ss-block" aria-labelledby="ss-refresh-title">
        <h2 id="ss-refresh-title" className="ss-block__title">
          How often data refreshes
        </h2>
        <dl className="ss-refresh">
          {REFRESH_ROWS.map((row) => (
            <div key={row.component} className="ss-refresh__row">
              <dt className="ss-refresh__component">{row.component}</dt>
              <dd className="ss-refresh__cadence">{row.cadence}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ss-block" aria-labelledby="ss-weighting-title">
        <h2 id="ss-weighting-title" className="ss-block__title">
          Not all signals are weighted equally
        </h2>
        <p className="ss-block__copy">
          The nine components that make up the SignalScore are not averaged equally. Institutional
          accumulation and insider activity carry the most weight in our model, reflecting the view
          that what large funds and company insiders actually do with real money is more predictive
          than any valuation metric alone. Valuation factors like PE ratio and forward PE carry
          moderate weight. Price-based inputs like 52-week support and gold price correlation serve
          as confirming or disconfirming signals rather than primary drivers. The exact weighting
          formula is proprietary, but the hierarchy is intentional and has been calibrated against
          historical price performance across the gold and silver mining sector.
        </p>
        <div className="ss-weights" aria-label="Relative signal weight tiers">
          {WEIGHT_TIERS.map((tier) => (
            <div key={tier.label} className="ss-weights__tier">
              <div className="ss-weights__meta">
                <span className="ss-weights__label">{tier.label}</span>
                <span className="ss-weights__detail">{tier.detail}</span>
              </div>
              <div className="ss-weights__track">
                <span className="ss-weights__fill" style={{ width: tier.width }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ss-block" aria-labelledby="ss-example-title">
        <h2 id="ss-example-title" className="ss-block__title">
          Seeing the score in action
        </h2>
        <article className="ss-case-study">
          <header className="ss-case-study__header">
            <p className="ss-case-study__company">Ridgeline Gold Corp</p>
            <p className="ss-case-study__meta">Illustrative example</p>
            <p className="ss-case-study__score">
              <span className="ss-case-study__score-value mono">83</span>
              <span className="ss-case-study__score-label">Strong conviction</span>
            </p>
          </header>
          <ul className="ss-case-study__breakdown">
            {CASE_STUDY_ROWS.map((row) => (
              <li key={row.factor} className="ss-case-study__row">
                <div className="ss-case-study__row-head">
                  <span className="ss-case-study__factor">{row.factor}</span>
                  <span className="ss-case-study__row-score mono">{row.score}</span>
                </div>
                <p className="ss-case-study__note">{row.note}</p>
              </li>
            ))}
          </ul>
        </article>
        <p className="ss-case-study__disclaimer">
          Ridgeline Gold Corp is a fictional company used for illustration only. All figures are
          hypothetical.
        </p>
      </section>

      <section className="ss-block" aria-labelledby="ss-conflict-title">
        <h2 id="ss-conflict-title" className="ss-block__title">
          When signals disagree
        </h2>
        <p className="ss-block__copy">
          Not every stock sends a clean signal. Sometimes institutions are quietly accumulating
          while insiders are selling, or valuation looks cheap but analyst targets are falling.
          When signals conflict, the SignalScore reflects that tension rather than hiding it. A
          stock where three factors score above 85 and two score below 50 will land in the
          mid-range, not at the top. This is intentional. We think a score that papers over
          disagreement is less useful than one that tells you the full picture. If you see a stock
          in the 55 to 70 range, it is worth asking which specific factors are dragging the score
          down before making any decision.
        </p>
      </section>

      <section className="ss-block" aria-labelledby="ss-faq-title">
        <h2 id="ss-faq-title" className="ss-block__title">
          Common questions
        </h2>
        <div className="ss-faq">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="ss-faq__item">
              <summary className="ss-faq__question">{item.question}</summary>
              <p className="ss-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

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

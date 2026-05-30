const WEIGHT_TIERS = [
  {
    label: "Smart-money footprints (the base)",
    detail: "Insider Form 4, Institutional 13F, Famous investor holdings — blended into SmartMoneyBase",
    width: "100%",
  },
  {
    label: "Gold torque (the multiplier)",
    detail: "Beta to gold/silver, normalized vs the miner universe — gentle nudge, not a fourth vote",
    width: "48%",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Can a stock score high and still decline in price?",
    answer:
      "Yes. The SignalScore reflects what the data shows at a point in time. It does not predict short-term price movements. A stock scoring 85 today could fall if gold prices drop sharply, if a major holder sells unexpectedly, or if operational news disappoints. The score is a measure of current smart-money signal quality, not a guarantee of future performance.",
  },
  {
    question: "How is this different from a stock screener?",
    answer:
      "Most screeners let you filter on one metric at a time — insider buying here, institutional ownership there. The SignalScore blends three smart-money footprints into one base, then applies a gentle gold-torque multiplier so you can compare miners at a glance. It is built specifically for gold and silver equities, using SEC filings and sector-relevant price leverage rather than generic screen filters.",
  },
  {
    question: "What happens when the model is updated?",
    answer:
      "When we adjust footprint emphasis or torque rules, scores are recalculated from the same inputs so rankings stay comparable. We note any methodology changes on this page.",
  },
  {
    question: "What does it mean when insider and institutional signals disagree?",
    answer:
      "It means the stock deserves closer scrutiny. Institutions have broad research capabilities but manage large portfolios and may hold positions for reasons unrelated to near-term conviction. Insiders have direct knowledge of company operations but may sell for personal liquidity reasons. When these two footprints point in opposite directions, we weight open-market insider buying more heavily, since purchasing with personal capital is a stronger signal than maintaining an existing fund position.",
  },
] as const;

export function SignalScoreSupplement() {
  return (
    <div className="ss-supplement">
      <section className="ss-block" aria-labelledby="ss-weighting-title">
        <h2 id="ss-weighting-title" className="ss-block__title">
          Footprints form the base; torque nudges the result
        </h2>
        <p className="ss-block__copy">
          The SignalScore is not a flat average of unrelated metrics. Three smart-money footprints
          — insider activity, institutional 13F accumulation, and famous-investor holdings — are
          blended into a SmartMoneyBase from 0 to 100. Insider activity carries the most emphasis,
          followed by institutional accumulation, then famous-investor overlap. That ordering
          reflects our view that real money moves in public filings are the strongest evidence of
          conviction, not a claim that we back-tested every combination against past returns.
        </p>
        <p className="ss-block__copy">
          Gold torque is applied as a gentle multiplier — typically between about 0.85 and 1.15 —
          not as a fourth weighted vote. We measure how much the stock&apos;s daily returns move
          with its metal proxy (GLD for gold names, SLV for silver names), compare that beta to the
          median miner in our universe (median = neutral, ×1.0), and clamp the effect so torque
          nudges rankings between similar names rather than overriding strong footprints. A stock
          with excellent smart-money footprints but modest torque still ranks well — just slightly
          behind a peer with the same footprints and higher leverage to gold.
        </p>
        <p className="ss-block__copy">
          If the statistical relationship to the metal is too noisy (low R²), torque defaults to
          neutral — no bonus and no penalty — rather than rewarding random co-movement.
        </p>
        <div className="ss-weights" aria-label="Footprint base vs torque multiplier">
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
          Not every stock sends a clean signal. Institutions may be quietly accumulating while
          insiders are selling, or famous-investor overlap may be strong while 13F data shows
          trimming. When footprints conflict, SmartMoneyBase reflects that tension rather than
          hiding it. A stock where insider and institutional readings diverge will land mid-range,
          not at the top — even if gold torque is favorable. If you see a score in the 55 to 70
          range, it is worth checking which specific footprints are pulling in opposite directions
          before making any decision.
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

import Link from "next/link";

type FactorRow = {
  name: string;
  score: number;
  note: string;
  noteHasInvestorsLink?: boolean;
};

type ContrastCard = {
  variant: "high" | "low";
  company: string;
  ticker: string;
  overallScore: number;
  tier: string;
  factors: FactorRow[];
  summary: string;
};

const HIGH_CARD: ContrastCard = {
  variant: "high",
  company: "Hartwell Mining Co",
  ticker: "HMC",
  overallScore: 86,
  tier: "Strong conviction",
  factors: [
    {
      name: "Institutional 13F Data",
      score: 91,
      note: "Four major gold-focused funds increased positions last quarter, net accumulation up 18%",
    },
    {
      name: "Insider Buying vs Selling",
      score: 89,
      note: "CEO purchased 240,000 shares on the open market 30 days ago, no insider selling in 12 months",
    },
    {
      name: "PE Ratio Analysis",
      score: 74,
      note: "Trailing PE sits 11% below sector median, offering a modest valuation discount",
    },
    {
      name: "Forward PE Projection",
      score: 82,
      note: "Forward multiple implies 28% earnings growth if gold holds at current levels",
    },
    {
      name: "Famous Investor Portfolio Tracking",
      score: 93,
      note: "Held by five of the precious-metals specialists tracked on our Investors page",
      noteHasInvestorsLink: true,
    },
    {
      name: "52-Week Support Level",
      score: 78,
      note: "Trading 9% above its 52-week low, a level that has held twice in the past year",
    },
    {
      name: "Gold Price Correlation",
      score: 88,
      note: "Moves closely with gold, giving investors real leverage when the metal rallies",
    },
    {
      name: "Analyst Price Target Upside",
      score: 85,
      note: "Consensus target across eight analysts implies 34% upside from today's price",
    },
    {
      name: "Executive Commentary Signal",
      score: 83,
      note: "CEO flagged a new high-grade discovery zone on the last earnings call, language was notably more confident than prior quarters",
    },
  ],
  summary:
    "Hartwell Mining Co is showing alignment across nearly every factor we track. Institutions are adding, insiders are putting personal capital in, valuation is reasonable, and the executives are signaling something new is developing. A score of 86 is not common. It reflects a stock where the weight of evidence is pointing in the same direction.",
};

const LOW_CARD: ContrastCard = {
  variant: "low",
  company: "Caldera Resources Inc",
  ticker: "CLDR",
  overallScore: 28,
  tier: "Avoid",
  factors: [
    {
      name: "Institutional 13F Data",
      score: 22,
      note: "Net institutional selling for two consecutive quarters, three major holders reduced positions significantly",
    },
    {
      name: "Insider Buying vs Selling",
      score: 18,
      note: "Two executives sold shares in the past 60 days, no open-market purchases in over a year",
    },
    {
      name: "PE Ratio Analysis",
      score: 35,
      note: "Trailing PE is elevated relative to peers, suggesting the stock may still be priced for growth that has not arrived",
    },
    {
      name: "Forward PE Projection",
      score: 30,
      note: "Analyst estimates have been revised down twice in the past six months, forward multiple offers little margin of safety",
    },
    {
      name: "Famous Investor Portfolio Tracking",
      score: 24,
      note: "Not held by any of the precious-metals specialists we track",
    },
    {
      name: "52-Week Support Level",
      score: 31,
      note: "Trading near its 52-week low, and that level has already been tested and broken once",
    },
    {
      name: "Gold Price Correlation",
      score: 42,
      note: "Correlation with gold has weakened, likely due to company-specific operational issues muting the relationship",
    },
    {
      name: "Analyst Price Target Upside",
      score: 29,
      note: "Two analysts have recently cut their price targets, consensus implies minimal upside from current levels",
    },
    {
      name: "Executive Commentary Signal",
      score: 20,
      note: "Most recent earnings call contained hedged language around production guidance and an unexpected write-down was disclosed",
    },
  ],
  summary:
    "Caldera Resources Inc is showing warning signs across almost every dimension. Institutions are leaving, insiders are not buying their own stock, valuation is not cheap enough to compensate for the risks, and the executives are not projecting confidence. A score of 28 is a signal to wait for conditions to improve before considering this name.",
};

function scoreTone(score: number): "high" | "mid" | "low" {
  if (score > 75) return "high";
  if (score >= 45) return "mid";
  return "low";
}

function FactorNote({ factor }: { factor: FactorRow }) {
  if (factor.noteHasInvestorsLink) {
    const parts = factor.note.split("Investors page");
    return (
      <p className="ss-contrast__factor-note">
        {parts[0]}
        <Link href="/investors">Investors</Link> page{parts[1] ?? ""}
      </p>
    );
  }
  return <p className="ss-contrast__factor-note">{factor.note}</p>;
}

function ContrastCardView({ card }: { card: ContrastCard }) {
  const overallTone = scoreTone(card.overallScore);

  return (
    <article className={`ss-contrast__card ss-contrast__card--${card.variant}`}>
      <header className="ss-contrast__card-header">
        <div className="ss-contrast__company">
          <h3 className="ss-contrast__company-name">{card.company}</h3>
          <span className="ss-contrast__ticker mono">{card.ticker}</span>
        </div>
        <div className="ss-contrast__overall">
          <p className={`ss-contrast__overall-value mono ss-contrast__score--${overallTone}`}>
            {card.overallScore}
          </p>
          <span className={`ss-contrast__tier ss-contrast__tier--${card.variant}`}>{card.tier}</span>
        </div>
      </header>

      <ul className="ss-contrast__factors">
        {card.factors.map((factor) => {
          const tone = scoreTone(factor.score);
          return (
            <li key={factor.name} className="ss-contrast__factor">
              <div className="ss-contrast__factor-row">
                <span className="ss-contrast__factor-name">{factor.name}</span>
                <div className="ss-contrast__factor-bar-wrap">
                  <div className="ss-contrast__factor-bar">
                    <span
                      className={`ss-contrast__factor-fill ss-contrast__factor-fill--${tone}`}
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
                <span className={`ss-contrast__factor-score mono ss-contrast__score--${tone}`}>
                  {factor.score}
                </span>
              </div>
              <FactorNote factor={factor} />
            </li>
          );
        })}
      </ul>

      <p className="ss-contrast__card-summary">{card.summary}</p>
    </article>
  );
}

export function ScoresInContrast() {
  return (
    <section className="ss-contrast" aria-labelledby="ss-contrast-title">
      <h2 id="ss-contrast-title" className="ss-contrast__title">
        Two stocks, two very different stories
      </h2>
      <p className="ss-contrast__intro">
        The same nine factors. Completely different conclusions. Here is what the SignalScore looks
        like when the data is strong versus when it is sending warnings.
      </p>
      <div className="ss-contrast__grid">
        <ContrastCardView card={HIGH_CARD} />
        <ContrastCardView card={LOW_CARD} />
      </div>
      <p className="ss-contrast__disclaimer">
        Hartwell Mining Co and Caldera Resources Inc are fictional companies used for illustration
        only. All figures are hypothetical.
      </p>
    </section>
  );
}

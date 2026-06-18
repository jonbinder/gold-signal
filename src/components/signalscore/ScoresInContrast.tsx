import Link from "next/link";

type FootprintRow = {
  name: string;
  score: number;
  note: string;
  noteHasInvestorsLink?: boolean;
};

type ContrastCard = {
  variant: "high" | "low";
  company: string;
  ticker: string;
  footprints: FootprintRow[];
  smartMoneyBase: number;
  torqueMultiplier: number;
  overallScore: number;
  tier: string;
  summary: string;
};

const HIGH_CARD: ContrastCard = {
  variant: "high",
  company: "Hartwell Mining Co",
  ticker: "HMC",
  footprints: [
    {
      name: "Insider Buying vs Selling",
      score: 89,
      note: "CEO purchased 240,000 shares on the open market 30 days ago, no insider selling in 12 months",
    },
    {
      name: "Institutional 13F Data",
      score: 91,
      note: "Four major gold-focused funds increased positions last quarter, net accumulation up 18%",
    },
    {
      name: "Famous Investor Portfolio Tracking",
      score: 93,
      note: "Held by five of the precious-metals specialists tracked on our Investors page",
      noteHasInvestorsLink: true,
    },
  ],
  smartMoneyBase: 91,
  torqueMultiplier: 1.12,
  overallScore: 100,
  tier: "Strong conviction",
  summary:
    "Hartwell shows strong alignment across all three smart-money footprints — insiders buying, institutions adding, and multiple famous specialists in the name. SmartMoneyBase of 91 is already exceptional. Gold torque of ×1.12 nudges the raw score above 100 (display capped at 100), reflecting meaningful leverage to gold without overriding the footprint story.",
};

const LOW_CARD: ContrastCard = {
  variant: "low",
  company: "Caldera Resources Inc",
  ticker: "CLDR",
  footprints: [
    {
      name: "Insider Buying vs Selling",
      score: 18,
      note: "Two executives sold shares in the past 60 days, no open-market purchases in over a year",
    },
    {
      name: "Institutional 13F Data",
      score: 22,
      note: "Net institutional selling for two consecutive quarters, three major holders reduced positions significantly",
    },
    {
      name: "Famous Investor Portfolio Tracking",
      score: 24,
      note: "Not held by any of the precious-metals specialists we track",
    },
  ],
  smartMoneyBase: 21,
  torqueMultiplier: 0.91,
  overallScore: 19,
  tier: "Avoid",
  summary:
    "Caldera's footprints are weak across the board — institutions leaving, insiders not buying, and no famous-investor overlap. SmartMoneyBase of 21 reflects that. Low gold torque (×0.91) dampens the score slightly, illustrating that torque is gentle: it does not rescue a name with poor smart-money evidence, it only nudges similar peers apart.",
};

function scoreTone(score: number): "high" | "mid" | "low" {
  if (score > 75) return "high";
  if (score >= 45) return "mid";
  return "low";
}

function FootprintNote({ row }: { row: FootprintRow }) {
  if (row.noteHasInvestorsLink) {
    const parts = row.note.split("Investors page");
    return (
      <p className="ss-contrast__factor-note">
        {parts[0]}
        <Link href="/portfolios">Portfolios</Link> page{parts[1] ?? ""}
      </p>
    );
  }
  return <p className="ss-contrast__factor-note">{row.note}</p>;
}

function ContrastCardView({ card }: { card: ContrastCard }) {
  const overallTone = scoreTone(card.overallScore);
  const rawScore = Math.round(card.smartMoneyBase * card.torqueMultiplier);

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

      <p className="ss-contrast__section-label">Smart-money footprints</p>
      <ul className="ss-contrast__factors">
        {card.footprints.map((row) => {
          const tone = scoreTone(row.score);
          return (
            <li key={row.name} className="ss-contrast__factor">
              <div className="ss-contrast__factor-row">
                <span className="ss-contrast__factor-name">{row.name}</span>
                <div className="ss-contrast__factor-bar-wrap">
                  <div className="ss-contrast__factor-bar">
                    <span
                      className={`ss-contrast__factor-fill ss-contrast__factor-fill--${tone}`}
                      style={{ width: `${row.score}%` }}
                    />
                  </div>
                </div>
                <span className={`ss-contrast__factor-score mono ss-contrast__score--${tone}`}>
                  {row.score}
                </span>
              </div>
              <FootprintNote row={row} />
            </li>
          );
        })}
      </ul>

      <div className="ss-contrast__math">
        <div className="ss-contrast__math-row">
          <span className="ss-contrast__math-label">SmartMoneyBase</span>
          <span className="ss-contrast__math-value mono">{card.smartMoneyBase}</span>
        </div>
        <div className="ss-contrast__math-row">
          <span className="ss-contrast__math-label">Gold torque</span>
          <span className="ss-contrast__math-value mono">×{card.torqueMultiplier.toFixed(2)}</span>
        </div>
        <div className="ss-contrast__math-row ss-contrast__math-row--result">
          <span className="ss-contrast__math-label">SignalScore</span>
          <span className="ss-contrast__math-value mono">
            {card.smartMoneyBase} × {card.torqueMultiplier.toFixed(2)} = {rawScore}
            {rawScore !== card.overallScore ? ` → ${card.overallScore} display` : ""}
          </span>
        </div>
      </div>

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
        The same three footprints and the same torque logic — completely different conclusions.
        Here is how SmartMoneyBase, gold torque, and the final SignalScore tie together when data
        is strong versus when it is sending warnings.
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

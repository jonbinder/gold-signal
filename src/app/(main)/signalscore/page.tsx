import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SignalScore, GoldSignal.ai",
  description:
    "How GoldSignal.ai calculates the 0–100 SignalScore for gold and silver stocks using 13F, insider, and valuation data.",
};

const METRICS = [
  {
    num: "01",
    title: "Institutional 13F Data",
    tags: ["SEC filings", "Quarterly data"],
    desc: (
      <>
        Every quarter, large investment firms are required to file a document with the SEC called a
        13F, a public record of every stock they hold. We track the top 500 institutional holders
        and measure whether they are buying more, holding steady, or quietly selling. When major
        funds are increasing their positions in a gold stock, that is a meaningful vote of
        confidence. Concentrated ownership, where a handful of highly regarded institutions hold
        large stakes, scores especially well.
      </>
    ),
  },
  {
    num: "02",
    title: "Insider Buying vs Selling",
    tags: ["Form 4 filings", "Recency weighted"],
    desc: (
      <>
        Company insiders, including CEOs, board members, and major shareholders, must report their
        own stock trades in a filing called Form 4. Insiders sell for many reasons, but they tend
        to buy for only one: they believe the stock is going higher. We weight each transaction by
        how recent it was and how much money was involved. A cluster of executives buying their own
        stock is one of the most reliable signals we track. Option exercises, which are routine and
        less meaningful, are discounted in our scoring.
      </>
    ),
  },
  {
    num: "03",
    title: "PE Ratio Analysis",
    tags: ["Valuation", "Sector benchmarked"],
    desc: (
      <>
        The Price-to-Earnings (PE) ratio tells you how much you are paying for every dollar of
        profit a company generates. A stock with a low PE relative to its peers may be
        undervalued, offering more earnings for your money. We do not use PE in isolation. Instead,
        we benchmark each stock against the median PE of other gold and silver producers, and
        against its own historical trading range. A stock near the cheap end of its historical
        valuation scores well here.
      </>
    ),
  },
  {
    num: "04",
    title: "Forward PE Projection",
    tags: ["Analyst estimates", "Forward looking"],
    desc: (
      <>
        While trailing PE looks at past earnings, the Forward PE uses analyst consensus estimates
        of what a company is expected to earn over the next 12 months. This is especially
        important in mining, where rising gold prices or changing costs can dramatically improve
        near-term profitability. We score stocks where the forward multiple implies meaningful
        upside, particularly when those earnings forecasts factor in favorable gold price
        scenarios. A stock trading cheap on forward earnings is often one the market has not yet
        fully re-rated. It is common for the market to not fully consider a stock&apos;s earnings
        until after they materialize and are reported.
      </>
    ),
  },
  {
    num: "05",
    title: "Famous Investor Portfolio Tracking",
    tags: ["Smart money", "Conviction layer"],
    desc: (
      <>
        Some of the world&apos;s most respected precious-metals investors have spent decades
        analyzing this sector. Self-made billionaires and serially successful entrepreneurs and fund
        managers are tracked. When a stock appears in the disclosed portfolios of these specialists,
        it carries extra weight, as they have done the due diligence most retail investors cannot.
        We track which stocks overlap with the holdings of well-known gold-focused fund managers
        and add a conviction bonus when multiple famous investors hold the same name. You can view
        the full list of tracked investors on our{" "}
        <Link href="/investors">Investors</Link> page.
      </>
    ),
  },
  {
    num: "06",
    title: "52-Week Support Level",
    tags: ["Price structure", "Downside protection"],
    desc: (
      <>
        Every stock has a 52-week low, which is the cheapest price it traded at over the past year.
        That price level often acts as a natural floor, or support, because buyers who missed the
        bottom tend to step back in near those prices. A stock trading close to its 52-week low may
        be near a point where investors historically backstop further declines. We score stocks that
        are near but not breaking below key support, signaling potential downside protection. Stocks
        that have already rebounded meaningfully from their lows can also score well, as it may
        indicate the support level held and momentum is recovering. See live rankings on our{" "}
        <Link href="/stocks">Stocks</Link> page.
      </>
    ),
  },
  {
    num: "07",
    title: "Gold Price Correlation",
    tags: ["Price leverage", 'Upside "Torque"'],
    desc: (
      <>
        Not all gold stocks respond the same to a rising gold price environment. Some miners are
        poorly hedged, badly managed, or structured in ways that cause them to barely move when the
        price of gold rallies. Gold Price Correlation measures how closely a stock actually tracks
        the price of gold over time. A high correlation means investors are getting more leverage
        to gold when they buy the stock, which is the whole point of owning gold equities over the
        physical metal. A low correlation is a red flag that something structural is muting the
        relationship. We reward stocks that move with gold the way they should. For example Agnico
        Eagle Mines has a long-standing policy of no forward gold sales or hedging to maintain full
        exposure to the gold price.
      </>
    ),
  },
  {
    num: "08",
    title: "Analyst Price Target Upside",
    tags: ["Analyst consensus", "Forward looking"],
    desc: (
      <>
        Independent analysts who cover gold and silver stocks publish price targets based on their
        own financial models, site visits, and management meetings. We take the average of these
        targets and compare it to where the stock trades today. The gap between the two is the
        implied upside. A stock trading well below where analysts collectively think it should be
        priced is worth paying attention to, especially when that view is shared across multiple
        firms rather than driven by a single outlier. This component adds an independent outside
        perspective that is distinct from our own valuation metrics.
      </>
    ),
  },
] as const;

const SUB_SCORES = [
  { label: "13F Institutional Conviction", value: 92 },
  { label: "Insider Buying vs Selling", value: 88 },
  { label: "PE Ratio", value: 79 },
  { label: "Forward PE Ratio", value: 84 },
  { label: "Famous Investor Overlap", value: 91 },
  { label: "52-Week Support Level", value: 86 },
  { label: "Gold Price Correlation", value: 88 },
  { label: "Analyst Price Target Upside", value: 83 },
] as const;

const SAMPLE_COMPOSITE = Math.round(
  SUB_SCORES.reduce((sum, item) => sum + item.value, 0) / SUB_SCORES.length,
);

export default function SignalScorePage() {
  return (
    <main>
      <section className="explained" id="signalscore">
        <header className="section-header">
          <h1 className="section-header__title">SignalScore Explained</h1>
          <p className="section-header__sub">
            The SignalScore is a single number from 0 to 100 that summarizes what the smartest money
            in precious metals is doing and whether a stock looks attractively valued right now. Eight
            data-driven inputs, one clear verdict.
          </p>
        </header>
        <div className="explained__grid">
          <aside className="explained__score-panel">
            <p className="explained__score-label">Sample composite</p>
            <div className="explained__score-header">
              <p className="explained__score-value">{SAMPLE_COMPOSITE}</p>
              <span className="explained__rating-badge">Strong Conviction</span>
            </div>
            <ul className="sub-scores">
              {SUB_SCORES.map((item) => (
                <li key={item.label} className="sub-score">
                  <span className="sub-score__label">{item.label}</span>
                  <span className="mono sub-score__value">{item.value}</span>
                  <span className="sub-score__bar">
                    <span className="sub-score__fill" style={{ width: `${item.value}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </aside>
          <ol className="explained__metrics">
            {METRICS.map((metric) => (
              <li key={metric.num} className="metric fade-in visible">
                <span className="metric__num mono">{metric.num}</span>
                <div>
                  <h2 className="metric__title">{metric.title}</h2>
                  <div className="metric__tags">
                    {metric.tags.map((tag) => (
                      <span key={tag} className="pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="metric__desc">{metric.desc}</p>
                </div>
              </li>
            ))}
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

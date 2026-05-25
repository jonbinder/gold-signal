import type { Metadata } from "next";
import Link from "next/link";
import { DataRefreshSection } from "@/components/signalscore/DataRefreshSection";
import { MetricIcon } from "@/components/signalscore/MetricIcon";
import { ScoreReferenceGuide } from "@/components/signalscore/ScoreReferenceGuide";
import { ScoresInContrast } from "@/components/signalscore/ScoresInContrast";
import { SignalScoreHero } from "@/components/signalscore/SignalScoreHero";
import { SignalScoreSupplement } from "@/components/signalscore/SignalScoreSupplement";

const pageDescription =
  "How GoldSignal.ai calculates the 0–100 SignalScore for gold and silver stocks using 13F filings, insider trades, free cash flow, and more.";

export const metadata: Metadata = {
  title: "SignalScore, GoldSignal.ai",
  description: pageDescription,
  openGraph: {
    title: "SignalScore, GoldSignal.ai",
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/signalscore",
  },
};

const METRICS = [
  {
    num: "01",
    icon: "ti-building-bank",
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
    icon: "ti-user-dollar",
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
    icon: "ti-chart-bar",
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
    icon: "ti-star",
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
    num: "05",
    icon: "ti-chart-line",
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
    num: "06",
    icon: "ti-coins",
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
    num: "07",
    icon: "ti-cash",
    title: "Free Cash Flow Yield",
    tags: ["Cash generation", "Value benchmarked"],
    desc: (
      <>
        Free Cash Flow Yield measures how much actual cash a company generates each year relative to
        its market value. While earnings can be manipulated by accounting decisions, cash flow is
        harder to fake. We calculate free cash flow per dollar of market cap and compare it to peers
        in the gold and silver mining sector. A high free cash flow yield means you are buying real,
        durable cash generation cheaply — exactly what respected value-oriented mining analysts look
        for. This signal is especially powerful in the mining sector, where capital intensity,
        exploration spending, and acquisition costs can make accounting profits look very different
        from actual cash production. A miner trading at a low price relative to its cash generation
        often represents genuine value the market has not fully recognized.
      </>
    ),
  },
] as const;

export default function SignalScorePage() {
  return (
    <main>
      <section className="explained" id="signalscore">
        <SignalScoreHero />
        <div className="explained__content">
          <ScoreReferenceGuide />
          <SignalScoreSupplement />
          <ol className="explained__metrics">
            {METRICS.map((metric) => (
              <li key={metric.num} className="metric fade-in visible">
                <div className="metric__lead">
                  <MetricIcon name={metric.icon} className="metric__icon" />
                  <span className="metric__num mono">{metric.num}</span>
                </div>
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
        <ScoresInContrast />
        <DataRefreshSection />
        <div className="ss-sources" aria-label="Data sources">
          <p className="ss-sources__label">Data sourced from</p>
          <ul className="ss-sources__list">
            <li>SEC EDGAR</li>
            <li>Form 4 Filings</li>
            <li>Exchange Price Feeds</li>
            <li>Polygon.io Fundamentals</li>
          </ul>
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

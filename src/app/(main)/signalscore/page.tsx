import type { Metadata } from "next";
import Link from "next/link";
import { DataRefreshSection } from "@/components/signalscore/DataRefreshSection";
import { MetricIcon } from "@/components/signalscore/MetricIcon";
import { ScoreReferenceGuide } from "@/components/signalscore/ScoreReferenceGuide";
import { ScoresInContrast } from "@/components/signalscore/ScoresInContrast";
import { SignalScoreHero } from "@/components/signalscore/SignalScoreHero";
import { SignalScoreSupplement } from "@/components/signalscore/SignalScoreSupplement";

const pageDescription =
  "How GoldSignal.ai calculates the 0–100 SignalScore for gold and silver stocks: insider buying, institutional 13F accumulation, famous investor holdings, and a gentle gold-torque multiplier.";

export const metadata: Metadata = {
  title: "SignalScore, GoldSignal.ai",
  description: pageDescription,
  openGraph: {
    title: "SignalScore, GoldSignal.ai",
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/signalscore",
  },
  twitter: {
    card: "summary",
    title: "SignalScore, GoldSignal.ai",
    description: pageDescription,
  },
};

const FOOTPRINT_METRICS = [
  {
    num: "01",
    icon: "ti-user-dollar",
    title: "Insider Buying vs Selling",
    tags: ["Form 4 filings", "Recency weighted"],
    desc: (
      <>
        Company insiders — CEOs, board members, and major shareholders — must report their own stock
        trades in a filing called Form 4. Insiders sell for many reasons, but they tend to buy for
        only one: they believe the stock is going higher. We weight each transaction by how recent
        it was and how much money was involved. A cluster of executives buying their own stock is
        one of the most reliable footprints we track. Routine option exercises are excluded from
        the net flow calculation.
      </>
    ),
  },
  {
    num: "02",
    icon: "ti-building-bank",
    title: "Institutional 13F Data",
    tags: ["SEC filings", "Quarterly data"],
    desc: (
      <>
        Every quarter, large investment firms file a 13F — a public record of their equity holdings.
        We measure whether institutions are accumulating, holding steady, or trimming a name, with
        emphasis on quarter-over-quarter change. When major funds increase positions in a gold
        stock, that is a meaningful vote of confidence. Concentrated ownership by highly regarded
        institutions scores especially well.
      </>
    ),
  },
  {
    num: "03",
    icon: "ti-star",
    title: "Famous Investor Portfolio Tracking",
    tags: ["Smart money", "Conviction layer"],
    desc: (
      <>
        Some of the world&apos;s most respected precious-metals investors have spent decades
        analyzing this sector. When a stock appears in the holdings of specialists we track, it
        carries extra weight — they have done due diligence most retail investors cannot replicate.
        We count overlap with well-known gold-focused managers and add conviction when multiple
        famous investors hold the same name. View the full list on our{" "}
        <Link href="/investors">Investors</Link> page.
      </>
    ),
  },
] as const;

const TORQUE_METRIC = {
  num: "04",
  icon: "ti-coins",
  title: "Gold Torque",
  tags: ["Beta leverage", "Gentle multiplier"],
  desc: (
    <>
      Gold torque measures how much a stock&apos;s daily returns move with its metal proxy — GLD for
      gold names, SLV for silver names. High beta means more leverage: when gold rises 1%, a 2×
      torque stock might move roughly 2%. We normalize each stock&apos;s beta against the median
      miner in our universe (median = neutral, multiplier ×1.0), then apply a gentle adjustment
      clamped to roughly 0.85–1.15. Torque nudges similar names apart; it does not replace strong
      or weak footprints. If the relationship is statistically unreliable (low R²), torque defaults
      to neutral — no bonus and no penalty. Agnico Eagle Mines, for example, has a long-standing
      policy of no forward gold sales or hedging, maintaining full exposure to the gold price — the
      kind of structural setup torque is designed to reflect.
    </>
  ),
} as const;

export default function SignalScorePage() {
  return (
    <main>
      <section className="explained" id="signalscore">
        <SignalScoreHero />
        <div className="explained__content">
          <ScoreReferenceGuide />
          <SignalScoreSupplement />

          <h2 className="ss-metrics-heading">The three footprints</h2>
          <p className="ss-metrics-intro">
            These smart-money signals blend into SmartMoneyBase (0–100). Weights renormalize when a
            footprint is unavailable — missing data is excluded, not guessed.
          </p>
          <ol className="explained__metrics">
            {FOOTPRINT_METRICS.map((metric) => (
              <li key={metric.num} className="metric fade-in visible">
                <div className="metric__lead">
                  <MetricIcon name={metric.icon} className="metric__icon" />
                  <span className="metric__num mono">{metric.num}</span>
                </div>
                <div>
                  <h3 className="metric__title">{metric.title}</h3>
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

          <h2 className="ss-metrics-heading">The torque multiplier</h2>
          <p className="ss-metrics-intro">
            Applied after SmartMoneyBase — a gentle adjustment for gold-price leverage, not a fourth
            weighted vote.
          </p>
          <ol className="explained__metrics explained__metrics--single">
            <li className="metric fade-in visible">
              <div className="metric__lead">
                <MetricIcon name={TORQUE_METRIC.icon} className="metric__icon" />
                <span className="metric__num mono">{TORQUE_METRIC.num}</span>
              </div>
              <div>
                <h3 className="metric__title">{TORQUE_METRIC.title}</h3>
                <div className="metric__tags">
                  {TORQUE_METRIC.tags.map((tag) => (
                    <span key={tag} className="pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="metric__desc">{TORQUE_METRIC.desc}</p>
              </div>
            </li>
          </ol>
        </div>
        <ScoresInContrast />
        <DataRefreshSection />
        <div className="ss-sources" aria-label="Data sources">
          <p className="ss-sources__label">Data sourced from</p>
          <ul className="ss-sources__list">
            <li>SEC EDGAR (13F + Form 4)</li>
            <li>Exchange price feeds</li>
            <li>Polygon.io market data</li>
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

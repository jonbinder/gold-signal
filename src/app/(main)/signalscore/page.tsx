import type { Metadata } from "next";
import Link from "next/link";
import { PageCompliance } from "@/components/layout/PageCompliance";
import { DataRefreshSection } from "@/components/signalscore/DataRefreshSection";
import { SITE_TAGLINE } from "@/lib/site";
import "../../about-page.css";

const pageDescription =
  "How GoldSignal.ai works: educator-led, facts-only coverage of SEC Form 4 insider trades, 13F institutional holdings, and 13D/13G stakes in gold and silver — no scores or predictions.";

export const metadata: Metadata = {
  title: "How It Works — GoldSignal.ai",
  description: pageDescription,
  alternates: {
    canonical: "https://goldsignal.ai/signalscore",
  },
  openGraph: {
    title: "How It Works — GoldSignal.ai",
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/signalscore",
  },
  twitter: {
    card: "summary",
    title: "How It Works — GoldSignal.ai",
    description: pageDescription,
  },
};

const DATA_TYPES = [
  {
    title: "Insider activity",
    body: "SEC Form 4 — open-market buys and sells by officers, directors, and other company insiders. We show who traded, their role, side, size, approximate value, and date.",
  },
  {
    title: "Institutional holdings",
    body: "SEC 13F — what funds reported owning last quarter and how positions changed (new, added, trimmed, or sold out). Filings typically land ~45 days after quarter-end, so 13F is always a lagging snapshot — we say that plainly on stock and fund pages.",
  },
  {
    title: "Large stakes",
    body: "SEC 13D and 13G — when an investor crosses a 5%+ stake and files a public schedule. Useful for spotting new concentrated positions.",
  },
] as const;

const SITE_GUIDE = [
  {
    name: "What's New",
    href: "/",
    detail: "A rolling view of notable insider, institutional, and large-stake activity across our tracked precious-metals universe.",
  },
  {
    name: "Stocks",
    href: "/stocks",
    detail: "Browse the universe, then open any ticker for Form 4 history, 13F context, charts, and company facts.",
  },
  {
    name: "Investors",
    href: "/investors",
    detail:
      "Browse curated investors and funds with sourced notable positions, plus auto-13F holdings for tracked filers.",
  },
  {
    name: "Free email readout",
    href: "/#portfolio-review",
    detail: "Submit tickers you care about — we email a plain-English readout sourced from stored filings (no live guesswork).",
  },
] as const;

export default function HowItWorksPage() {
  const substackUrl =
    process.env.NEXT_PUBLIC_SUBSTACK_URL?.trim() ||
    process.env.SUBSTACK_URL?.trim() ||
    null;

  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-hero-title">
        <div className="about-hero__inner">
          <p className="about-hero__eyebrow">About · How it works</p>
          <h1 id="about-hero-title" className="about-hero__title">
            Built by an investor who wanted the filings in one place
          </h1>
          <p className="about-hero__lead">
            I&apos;m a gold and silver investor who got tired of guessing. I have a data-systems
            background, so I built the tool I wished existed — one that pulls together what insiders
            and institutions are actually doing, straight from public filings, and makes it readable.
          </p>
          <p className="about-bio-placeholder" role="note">
            <strong>[Bio placeholder]</strong> — Add any specifics you want here (background, focus,
            how you use the site). Keep it short; this box is easy to swap out later.
          </p>
        </div>
      </section>

      <section className="about-section" id="philosophy" aria-labelledby="philosophy-title">
        <div className="about-section__inner">
          <h2 id="philosophy-title" className="about-section__title">
            Philosophy
          </h2>
          <p className="about-tagline">
            <em>{SITE_TAGLINE}.</em>
          </p>
          <p className="about-thesis">
            The best information is already public — it&apos;s just buried.
          </p>
          <div className="about-prose">
            <p>
              Every insider trade and institutional position is filed with the SEC, but scattered
              across thousands of documents. GoldSignal gathers it, and teaches you to read it.
            </p>
            <p>
              We show you the facts and how to interpret them. We do not publish ratings,
              predictions, or buy/sell calls. You decide what matters — that educator-not-prophet
              stance is intentional, not a disclaimer we hide in fine print.
            </p>
          </div>
          <p className="about-stance">
            Smart-money filings are context, not prophecy. Insider buying can precede bad news; a
            fund adding shares doesn&apos;t guarantee a rally. We aggregate public data so you can
            compare names quickly — then do your own work on geology, balance sheet, and macro.
          </p>
        </div>
      </section>

      <section
        className="about-section about-section--alt"
        id="data"
        aria-labelledby="data-title"
      >
        <div className="about-section__inner">
          <h2 id="data-title" className="about-section__title">
            What we show &amp; where it comes from
          </h2>
          <div className="about-data-grid">
            {DATA_TYPES.map((item) => (
              <article key={item.title} className="about-data-card">
                <h3 className="about-data-card__title">{item.title}</h3>
                <p className="about-data-card__body">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="about-source">
            <strong>Sources:</strong> SEC EDGAR (Form 4, 13F, 13D/13G) plus exchange price and
            reference data where available. Data is ingested and refreshed automatically — nothing
            speculated, nothing hand-entered to fill gaps. When a ticker lacks filings, you&apos;ll
            see an honest empty state instead of invented numbers.
          </p>
          <p className="about-teaching">
            How to read this: start with whether insiders and funds are moving in the same direction,
            then check whether activity is clustered in time. One Form 4 isn&apos;t a thesis; a
            pattern across quarters might be worth your attention.
          </p>
          <DataRefreshSection />
        </div>
      </section>

      <section className="about-section" id="use-the-site" aria-labelledby="use-title">
        <div className="about-section__inner">
          <h2 id="use-title" className="about-section__title">
            How to use the site
          </h2>
          <ul className="about-steps">
            {SITE_GUIDE.map((item) => (
              <li key={item.name}>
                <strong>
                  <Link href={item.href} className="about-link">
                    {item.name}
                  </Link>
                </strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
          {substackUrl ? (
            <p className="about-prose" style={{ marginTop: "1.25rem" }}>
              For longer-form teaching and sector notes,{" "}
              <a
                href={substackUrl}
                className="about-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                subscribe on Substack
              </a>{" "}
              — the site stays facts-first; the newsletter goes deeper when you want it.
            </p>
          ) : (
            <p className="about-prose" style={{ marginTop: "1.25rem" }}>
              {/* PLACEHOLDER: Set NEXT_PUBLIC_SUBSTACK_URL for a live Substack link. */}
              Longer-form notes may appear on Substack — link will show here once configured.
            </p>
          )}
          <div className="about-cta">
            <Link href="/" className="about-btn about-btn--primary">
              What&apos;s New
            </Link>
            <Link href="/stocks" className="about-btn about-btn--secondary">
              Browse stocks
            </Link>
          </div>
        </div>
      </section>

      <PageCompliance className="about-compliance" />
    </div>
  );
}

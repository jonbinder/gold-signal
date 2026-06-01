import type { Metadata } from "next";
import Link from "next/link";
import { DataRefreshSection } from "@/components/signalscore/DataRefreshSection";

const pageDescription =
  "How GoldSignal.ai sources and displays famous-investor holdings and SEC Form 4 insider activity for gold and silver stocks — facts first, no black-box score.";

export const metadata: Metadata = {
  title: "About — GoldSignal.ai",
  description: pageDescription,
  openGraph: {
    title: "About — GoldSignal.ai",
    description: pageDescription,
    type: "website",
    url: "https://goldsignal.ai/signalscore",
  },
  twitter: {
    card: "summary",
    title: "About — GoldSignal.ai",
    description: pageDescription,
  },
};

const DATA_SOURCES = [
  {
    title: "Institutional funds (13F)",
    body: "We are building a funds view from SEC 13F filings — quarterly institutional holdings reported to the SEC. That replaces the old curated famous-investor portfolio pages on the public site.",
  },
  {
    title: "Insider transactions (Form 4)",
    body: "Corporate insiders must report buys and sells of company stock on SEC Form 4. We show recent non-derivative transactions: who traded, their role, buy or sell, shares, approximate dollar value, and date. When no recent filings exist, the stock page states that honestly.",
  },
  {
    title: "Company reference data",
    body: "Market cap, exchange, sector labels, and company descriptions come from exchange feeds and SEC reference data where available. Missing fields are shown as unavailable — we never fabricate fundamentals.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="explained explained--hero" id="about-intro">
        <div className="explained__inner">
          <p className="explained__eyebrow">About GoldSignal.ai</p>
          <h1 className="explained__title">We show the facts. You decide.</h1>
          <p className="explained__lead">
            GoldSignal.ai is built for investors who want a Dataroma-style, facts-only view of
            precious-metals equities: insider Form 4 activity, company reference data, and
            institutional 13F funds. We do not publish a composite SignalScore or letter grade on the
            public site.
          </p>
          {/* PLACEHOLDER: Replace this block with your founder/origin story. */}
          <div className="explained__placeholder" style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", border: "1px dashed var(--gold-500, #C9971C)", borderRadius: "4px", background: "rgba(201, 151, 28, 0.06)" }}>
            <p className="explained__lead" style={{ margin: 0, fontSize: "0.9375rem" }}>
              <strong>[Founder story placeholder]</strong> — Add a short paragraph here about why
              GoldSignal exists, who built it, and what problem it solves for precious-metals
              investors.
            </p>
          </div>
        </div>
      </section>

      <section className="explained" id="data-we-show">
        <div className="explained__inner">
          <h2 className="explained__section-title">What we show</h2>
          <div className="explained__grid">
            {DATA_SOURCES.map((item) => (
              <article key={item.title} className="explained__card">
                <h3 className="explained__card-title">{item.title}</h3>
                <p className="explained__card-body">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="explained explained--alt" id="philosophy">
        <div className="explained__inner">
          <h2 className="explained__section-title">Philosophy</h2>
          <p className="explained__lead">
            Smart-money activity is useful context, not a guarantee. A stock held by respected
            investors can still fall; insider buying can precede bad news. We aggregate public filings
            so you can compare names quickly — then do your own work on geology, balance sheet, and
            macro.
          </p>
          <p className="explained__lead">
            When data is missing or sparse (common for juniors), we show honest empty states instead
            of filling gaps with guesses.
          </p>
        </div>
      </section>

      <DataRefreshSection />

      <section className="explained" id="explore">
        <div className="explained__inner explained__inner--center">
          <h2 className="explained__section-title">Start exploring</h2>
          <p className="explained__lead">
            Browse{" "}
            <Link href="/funds" className="explained__link">
              funds (13F)
            </Link>
            , look up any{" "}
            <Link href="/stocks" className="explained__link">
              stock
            </Link>
            , or request a free{" "}
            <Link href="/#portfolio-review" className="explained__link">
              portfolio facts summary
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

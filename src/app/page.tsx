import type { Metadata } from "next";
import Link from "next/link";
import GoldSignalClient from "./components/GoldSignalClient";
import { SiteNav } from "@/components/goldsignal/SiteNav";
import { SiteFooter } from "@/components/goldsignal/SiteFooter";
import { FeaturedInvestorsCarousel } from "@/components/home/FeaturedInvestorsCarousel";
import {
  IconBarChart,
  IconCrosshair,
  IconGauge,
  IconLayers,
  IconUsers,
} from "@/components/home/HubIcons";
import { getInvestors, getStocks } from "@/lib/goldsignal/data";
import { ScoreBadge } from "@/components/goldsignal/ScoreBadge";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  name: "GoldSignal.ai",
  description:
    "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios, and more.",
  url: "https://goldsignal.ai/",
};

export const metadata: Metadata = {
  title: "GoldSignal.ai — Gold & Silver Stock Rankings Powered by AI",
  description:
    "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios, and more.",
  alternates: {
    canonical: "https://goldsignal.ai/",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23C9971C'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "GoldSignal.ai — Gold & Silver Stock Rankings Powered by AI",
    description:
      "See which gold and silver stocks the world's biggest investors are buying. SignalScore ranks every stock using 13F filings, insider trades, PE ratios, and more.",
    type: "website",
    url: "https://goldsignal.ai/",
  },
};

const HUB_ICONS = [IconUsers, IconBarChart, IconCrosshair] as const;

function hubLinks(investorCount: number) {
  return [
    {
      href: "/investors",
      title: "Investors",
      description: `${investorCount} famous gold & silver investors — portfolios synced from your Excel workbook.`,
      cta: "Browse investors",
    },
    {
      href: "/stocks",
      title: "Stocks",
      description: "Full SignalScore rankings for every precious metals stock you track.",
      cta: "View rankings",
    },
    {
      href: "/signalscore",
      title: "SignalScore",
      description: "How we calculate the 0–100 composite rating across filings, insiders, and valuation.",
      cta: "Read methodology",
    },
  ] as const;
}

export default function HomePage() {
  const investors = getInvestors();
  const topStocks = getStocks().slice(0, 6);
  const featuredInvestors = investors.slice(0, 8);
  const HUB_LINKS = hubLinks(investors.length);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <SiteNav />

      <main className="home-page">
        <section className="hero" id="about">
          <div className="hero__inner">
            <div className="hero__content">
              <p className="hero__eyebrow">Powered by 13F · Insider · PE · Forward PE</p>
              <h1 className="hero__title">
                Rank <em>gold &amp; silver</em> stocks with institutional-grade intelligence
              </h1>
              <p className="hero__sub">
                GoldSignal.ai scores precious metals equities from 0–100 using SignalScore — and tracks
                where the world&apos;s top mining investors are positioned.
              </p>
              <div className="hero__stats">
                <div className="hero__stat">
                  <span className="hero__stat-icon" aria-hidden="true">
                    <IconLayers />
                  </span>
                  <span className="hero__stat-value mono">{getStocks().length}+</span>
                  <span className="hero__stat-label">Stocks ranked</span>
                </div>
                <div className="hero__stat">
                  <span className="hero__stat-icon" aria-hidden="true">
                    <IconUsers />
                  </span>
                  <span className="hero__stat-value mono">{investors.length}</span>
                  <span className="hero__stat-label">Investors tracked</span>
                </div>
                <div className="hero__stat">
                  <span className="hero__stat-icon" aria-hidden="true">
                    <IconGauge />
                  </span>
                  <span className="hero__stat-value mono">0–100</span>
                  <span className="hero__stat-label">SignalScore scale</span>
                </div>
              </div>
            </div>
            <div className="hero__visual">
              <div className="hero__wave" aria-hidden="true">
                <svg
                  className="hero__wave-svg"
                  viewBox="0 0 520 420"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M40 320 C120 180 200 140 320 200 S480 120 520 80"
                    stroke="#B8860B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 360 C100 240 220 200 340 260 S460 160 520 140"
                    stroke="#C9971C"
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                  <path
                    d="M80 380 C160 280 280 240 400 300 S500 220 520 200"
                    stroke="#D4A84B"
                    strokeWidth="0.75"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/gs-phone.png"
                alt="GoldSignal.ai app showing SignalScore rankings for precious metals stocks"
                className="hero__phone"
                width={420}
                height={840}
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        <section className="hub" aria-label="Explore GoldSignal">
          <header className="section-header section-header--hub">
            <h2 className="section-header__title">Explore GoldSignal</h2>
            <p className="section-header__sub">
              Three views into the same dataset — updated when you push changes to GitHub.
            </p>
          </header>
          <div className="hub__grid">
            {HUB_LINKS.map((item, index) => {
              const Icon = HUB_ICONS[index];
              return (
                <Link key={item.href} href={item.href} className="hub-card">
                  <span className="hub-card__icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div className="hub-card__body">
                    <h3 className="hub-card__title">{item.title}</h3>
                    <p className="hub-card__text">{item.description}</p>
                  </div>
                  <span className="hub-card__cta">{item.cta} →</span>
                  <span className="hub-card__chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <FeaturedInvestorsCarousel investors={featuredInvestors} totalCount={investors.length} />

        <section className="rankings rankings--preview" id="rankings-preview">
          <header className="section-header section-header--dark">
            <h2 className="section-header__title">Top SignalScores</h2>
            <p className="section-header__sub">
              <Link href="/stocks">Full stock rankings →</Link>
            </p>
          </header>
          <div className="rankings__mobile-columns" aria-hidden="true">
            <span>Rank</span>
            <span>Ticker</span>
            <span>Company</span>
            <span>SignalScore</span>
          </div>
          <div className="rankings__table-wrap rankings__table-wrap--desktop">
            <table className="rankings-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Ticker</th>
                  <th scope="col">Company</th>
                  <th scope="col">SignalScore</th>
                </tr>
              </thead>
              <tbody>
                {topStocks.map((stock, index) => (
                  <tr key={stock.ticker}>
                    <td className="mono">{index + 1}</td>
                    <td className="mono rankings-table__ticker">{stock.ticker}</td>
                    <td>{stock.company}</td>
                    <td>
                      <ScoreBadge score={stock.signalScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="portfolio-review portfolio-review--home" id="portfolio-review">
          <header className="section-header section-header--center">
            <h2 className="section-header__title">Free Portfolio Review</h2>
            <p className="section-header__sub">
              Submit your holdings and receive a personalized SignalScore breakdown for each
              position.
            </p>
          </header>
          <form className="portfolio-form" id="portfolio-form" noValidate>
            <div className="portfolio-form__card">
              <div className="portfolio-form__row">
                <label className="portfolio-form__field">
                  <span className="portfolio-form__label">Name</span>
                  <input
                    type="text"
                    name="name"
                    id="review-name"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
                <label className="portfolio-form__field">
                  <span className="portfolio-form__label">Email</span>
                  <input
                    type="email"
                    name="email"
                    id="review-email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                  />
                </label>
              </div>
              <label className="portfolio-form__field portfolio-form__field--full">
                <span className="portfolio-form__label">Tickers in your portfolio</span>
                <textarea
                  name="tickers"
                  id="review-tickers"
                  rows={4}
                  placeholder="NEM, FNV, WPM, AG…"
                  required
                />
              </label>
              <button type="submit" className="btn btn--submit btn--full">
                Submit for Review
              </button>
              <p className="portfolio-form__note">
                You will receive your SignalScore report by email within a few minutes
              </p>
            </div>
          </form>
        </section>

        <GoldSignalClient />
      </main>

      <SiteFooter />
    </>
  );
}

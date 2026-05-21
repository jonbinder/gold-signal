"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { InvestorAvatar } from "@/components/InvestorAvatar";
import type { Investor } from "@/lib/goldsignal/data";
import { investorDisplayName } from "@/lib/investor-display-name";

interface FeaturedInvestorsCarouselProps {
  investors: Investor[];
  totalCount: number;
}

export function FeaturedInvestorsCarousel({ investors, totalCount }: FeaturedInvestorsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const dotCount = Math.min(5, Math.max(1, investors.length));

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".investor-card")?.clientWidth ?? 172;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveDot(Math.min(dotCount - 1, Math.max(0, index)));
  }, [dotCount]);

  return (
    <section className="investors investors--preview" id="investors-preview">
      <header className="section-header section-header--row">
        <h2 className="section-header__title">Featured investors</h2>
        <Link href="/investors" className="section-header__link">
          View all {totalCount} investors →
        </Link>
      </header>
      <div className="investors-carousel-wrap">
        <div ref={trackRef} className="investors-carousel" onScroll={onScroll}>
          {investors.map((investor) => (
            <article key={investor.slug} className="investor-card investor-card--carousel fade-in visible">
              <InvestorAvatar slug={investor.slug} name={investor.name} size={48} className="investor-card__avatar" />
              <h3 className="investor-card__name">
                <Link href={`/investors/${investor.slug}`}>{investorDisplayName(investor.name, investor.sheetName)}</Link>
              </h3>
              <p className="investor-card__role">{investor.role}</p>
              <div className="investor-card__tickers">
                {investor.tickers.slice(0, 4).map((ticker) => (
                  <span key={ticker} className="pill pill--mobile">
                    {ticker}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="investors-carousel__dots" aria-hidden="true">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span key={i} className={`investors-carousel__dot ${i === activeDot ? "is-active" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

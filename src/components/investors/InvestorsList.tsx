import Link from "next/link";
import { HomePortfolioCardPhoto } from "@/components/home/HomePortfolioCardPhoto";
import { investorPath } from "@/lib/paths";
import type { InvestorListItem } from "@/lib/investors/types";

type Props = {
  investors: InvestorListItem[];
};

export function InvestorsList({ investors }: Props) {
  if (investors.length === 0) {
    return (
      <div className="investors-empty" role="status">
        <h2 className="investors-empty__title">No tracked investors yet</h2>
        <p className="investors-empty__body">
          Curated investors and funds appear here once positions are synced from SEC filings and our
          sourced research sheet. Check back after the next data refresh.
        </p>
      </div>
    );
  }

  return (
    <ul className="investors-portfolio-grid">
      {investors.map((inv, index) => {
        const role = inv.titleRole ?? inv.focusNote;
        const stockLabel = `${inv.positionCount} tracked position${inv.positionCount === 1 ? "" : "s"}`;

        return (
          <li key={inv.id}>
            <article className="home-portfolio-card home-portfolio-card--compact investors-portfolio-card">
              <Link href={investorPath(inv.slug)} className="home-portfolio-card__photo-link" tabIndex={-1}>
                <HomePortfolioCardPhoto name={inv.name} slug={inv.slug} priority={index < 6} />
              </Link>
              <div className="home-portfolio-card__body">
                <Link href={investorPath(inv.slug)} className="home-portfolio-card__name">
                  {inv.name}
                </Link>
                {role ? <p className="home-portfolio-card__firm">{role}</p> : null}
                <p className="investors-portfolio-card__meta tabular-nums">
                  <span className={`investor-type-badge investor-type-badge--${inv.type}`}>
                    {inv.type === "fund" ? "Fund" : "Individual"}
                  </span>
                  <span className="investors-portfolio-card__count">{stockLabel}</span>
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

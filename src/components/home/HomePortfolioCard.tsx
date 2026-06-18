import Link from "next/link";
import { HomePortfolioCardPhoto } from "@/components/home/HomePortfolioCardPhoto";
import { PositionCountLabel } from "@/components/investors/PositionCountLabel";
import { investorPath } from "@/lib/paths";
import type { HomePopularInvestorRow } from "@/lib/home/types";

type HomePortfolioCardProps = {
  row: HomePopularInvestorRow;
  priorityPhoto?: boolean;
};

export function HomePortfolioCard({ row, priorityPhoto = false }: HomePortfolioCardProps) {
  return (
    <article className="home-portfolio-card home-portfolio-card--compact">
      <Link href={investorPath(row.slug)} className="home-portfolio-card__photo-link" tabIndex={-1}>
        <HomePortfolioCardPhoto
          name={row.name}
          slug={row.slug}
          photoUrl={row.photoUrl}
          priority={priorityPhoto}
        />
      </Link>
      <div className="home-portfolio-card__body">
        <Link href={investorPath(row.slug)} className="home-portfolio-card__name">
          {row.name}
        </Link>
        <p className="home-portfolio-card__firm home-portfolio-card__bio">{row.bioShort}</p>
        {row.firm ? <p className="home-portfolio-card__firm">{row.firm}</p> : null}
        <Link href={investorPath(row.slug)} className="home-portfolio-card__stocks">
          <PositionCountLabel
            count={row.stockCount}
            singular="Stock"
            plural="Stocks"
          />
        </Link>
      </div>
    </article>
  );
}

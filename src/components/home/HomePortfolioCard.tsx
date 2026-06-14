import Link from "next/link";
import { HomePortfolioCardPhoto } from "@/components/home/HomePortfolioCardPhoto";
import { investorPath } from "@/lib/paths";
import type { HomePopularInvestorRow } from "@/lib/home/types";

type HomePortfolioCardProps = {
  row: HomePopularInvestorRow;
  priorityPhoto?: boolean;
};

export function HomePortfolioCard({ row, priorityPhoto = false }: HomePortfolioCardProps) {
  const stockLabel = `${row.stockCount} Stock${row.stockCount === 1 ? "" : "s"}`;

  return (
    <article className="home-portfolio-card">
      <HomePortfolioCardPhoto name={row.name} slug={row.slug} priority={priorityPhoto} />
      <div className="home-portfolio-card__body">
        <Link href={investorPath(row.slug)} className="home-portfolio-card__name">
          {row.name}
        </Link>
        {row.firm ? <p className="home-portfolio-card__firm">{row.firm}</p> : null}
        <Link href={investorPath(row.slug)} className="home-portfolio-card__stocks">
          {stockLabel}
        </Link>
      </div>
    </article>
  );
}

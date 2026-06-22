import Link from "next/link";
import { HomePortfolioCardPhoto } from "@/components/home/HomePortfolioCardPhoto";
import { investorPath } from "@/lib/paths";
import type { HomePopularInvestorRow } from "@/lib/home/types";

type HomePortfolioTileProps = {
  row: HomePopularInvestorRow;
  priorityPhoto?: boolean;
};

export function HomePortfolioTile({ row, priorityPhoto = false }: HomePortfolioTileProps) {
  const href = investorPath(row.slug);

  return (
    <article className="home-portfolio-tile">
      <Link href={href} className="home-portfolio-tile__photo-link" tabIndex={-1} aria-hidden="true">
        <HomePortfolioCardPhoto
          name={row.name}
          slug={row.slug}
          photoUrl={row.photoUrl}
          priority={priorityPhoto}
          className="home-portfolio-tile__photo"
        />
      </Link>
      <Link href={href} className="home-portfolio-tile__name">
        {row.name}
      </Link>
    </article>
  );
}

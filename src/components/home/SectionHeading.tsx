import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SectionHeadingProps = {
  title: string;
  href: "/portfolios" | "/stocks";
  subtitle?: string;
};

export function SectionHeading({ title, href, subtitle }: SectionHeadingProps) {
  return (
    <div className="home-section-heading">
      <Link
        href={href}
        className="home-section-heading__link"
        aria-label={`${title}: view all`}
      >
        <span className="home-section-heading__title">{title}</span>
        <ChevronRight className="home-section-heading__chevron" aria-hidden="true" />
      </Link>
      {subtitle ? <p className="home-section-heading__subtitle">{subtitle}</p> : null}
    </div>
  );
}

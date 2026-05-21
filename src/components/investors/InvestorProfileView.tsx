import Link from "next/link";
import { InvestorAvatar } from "@/components/InvestorAvatar";
import { InvestorHoldingsTable } from "@/components/investors/InvestorHoldingsTable";
import type { InvestorProfile } from "@/lib/investors-data";

interface InvestorProfileViewProps {
  investor: InvestorProfile;
}

export function InvestorProfileView({ investor }: InvestorProfileViewProps) {
  const websiteHref = investor.website
    ? investor.website.startsWith("http")
      ? investor.website
      : `https://${investor.website}`
    : null;

  return (
    <section className="investor-profile">
      <Link href="/investors" className="investor-profile__breadcrumb mono">
        ← All investors
      </Link>

      <div className="investor-profile__hero">
        <InvestorAvatar
          slug={investor.slug}
          name={investor.displayName}
          size={150}
          className="investor-profile__photo"
        />
        <div className="investor-profile__intro">
          <h1 className="investor-profile__name">{investor.displayName}</h1>
          <p className="investor-profile__firm">{investor.firm}</p>
          {websiteHref ? (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="investor-profile__website"
            >
              {investor.website}
            </a>
          ) : null}
          <p className="investor-profile__bio">{investor.bio}</p>
        </div>
      </div>

      <InvestorHoldingsTable holdings={investor.holdings} />
    </section>
  );
}

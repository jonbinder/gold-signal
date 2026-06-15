import Link from "next/link";
import { InvestorImage } from "@/components/investors/InvestorImage";
import { investorPath } from "@/lib/paths";
import type { InvestorListItem } from "@/lib/investors/types";

type Props = {
  investors: InvestorListItem[];
};

export function InvestorsList({ investors }: Props) {
  if (investors.length === 0) {
    return <p className="funds-empty">No published investors yet.</p>;
  }

  return (
    <ul className="funds-grid">
      {investors.map((inv) => (
        <li key={inv.id}>
          <Link href={investorPath(inv.slug)} className="funds-card">
            <div className="investor-card__head">
              {inv.photoUrl ? (
                <InvestorImage
                  src={inv.photoUrl}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="investor-card__photo"
                />
              ) : (
                <span className="investor-card__photo investor-card__photo--placeholder" aria-hidden>
                  {inv.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <span className={`investor-type-badge investor-type-badge--${inv.type}`}>
                {inv.type === "fund" ? "Fund" : "Individual"}
              </span>
            </div>
            <h2 className="funds-card__name">{inv.name}</h2>
            {inv.titleRole ? <p className="funds-card__meta">{inv.titleRole}</p> : null}
            {inv.focusNote ? <p className="funds-card__meta">{inv.focusNote}</p> : null}
            <p className="funds-card__stats">
              {inv.positionCount} tracked position{inv.positionCount === 1 ? "" : "s"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

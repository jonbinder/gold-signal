import Link from "next/link";
import { investorPath } from "@/lib/paths";
import type { InvestorListItem } from "@/lib/investors/types";

type Props = {
  investors: InvestorListItem[];
  sort: "name" | "positions" | "type";
};

export function InvestorsList({ investors, sort }: Props) {
  return (
    <>
      <div className="funds-toolbar">
        <div>
          <span className="funds-toolbar__label">Sort by</span>
          <div className="funds-toolbar__sorts">
            <Link
              href={{ pathname: "/investors", query: { sort: "name" } }}
              className={`funds-toolbar__sort-link ${sort === "name" ? "funds-toolbar__sort-link--active" : ""}`}
            >
              Name {sort === "name" ? "✓" : ""}
            </Link>
            <Link
              href={{ pathname: "/investors", query: { sort: "positions" } }}
              className={`funds-toolbar__sort-link ${sort === "positions" ? "funds-toolbar__sort-link--active" : ""}`}
            >
              # positions {sort === "positions" ? "✓" : ""}
            </Link>
            <Link
              href={{ pathname: "/investors", query: { sort: "type" } }}
              className={`funds-toolbar__sort-link ${sort === "type" ? "funds-toolbar__sort-link--active" : ""}`}
            >
              Type {sort === "type" ? "✓" : ""}
            </Link>
          </div>
        </div>
      </div>

      {investors.length === 0 ? (
        <p className="funds-empty">No published investors yet.</p>
      ) : (
        <ul className="funds-grid">
          {investors.map((inv) => (
            <li key={inv.id}>
              <Link href={investorPath(inv.slug)} className="funds-card">
                <div className="investor-card__head">
                  {inv.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inv.photoUrl} alt="" className="investor-card__photo" />
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
      )}
    </>
  );
}

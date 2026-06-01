import Link from "next/link";
import type { FundListItem } from "@/lib/funds/queries";

type Props = {
  funds: FundListItem[];
  sort: "name" | "pm-holdings";
};

export function FundsList({ funds, sort }: Props) {
  return (
    <>
      <div className="funds-toolbar">
        <div>
          <span className="funds-toolbar__label">Sort by</span>
          <div style={{ marginTop: "0.35rem" }}>
            <Link
              href={{ pathname: "/funds", query: { sort: "name" } }}
              className={sort === "name" ? "explained__link" : undefined}
              style={{ marginRight: "1rem", fontSize: "0.875rem" }}
            >
              Name {sort === "name" ? "✓" : ""}
            </Link>
            <Link
              href={{ pathname: "/funds", query: { sort: "pm-holdings" } }}
              className={sort === "pm-holdings" ? "explained__link" : undefined}
              style={{ fontSize: "0.875rem" }}
            >
              PM holdings {sort === "pm-holdings" ? "✓" : ""}
            </Link>
          </div>
        </div>
      </div>

      {funds.length === 0 ? (
        <p className="funds-empty">No tracked funds configured yet.</p>
      ) : (
        <ul className="funds-grid">
          {funds.map((fund) => (
            <li key={fund.slug}>
              <Link href={`/funds/${fund.slug}`} className="funds-card">
                <h2 className="funds-card__name">{fund.name}</h2>
                {fund.managerName ? (
                  <p className="funds-card__meta">{fund.managerName}</p>
                ) : null}
                {fund.focusNote ? <p className="funds-card__meta">{fund.focusNote}</p> : null}
                <p className="funds-card__stats">
                  {fund.hasHoldings
                    ? `${fund.pmHoldingsCount} precious-metals holding${fund.pmHoldingsCount === 1 ? "" : "s"}`
                    : "Latest filing pending"}
                  {fund.periodLabel ? ` · ${fund.periodLabel}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

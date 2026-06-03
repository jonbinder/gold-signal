"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { InvestorImage } from "@/components/investors/InvestorImage";
import { investorPath } from "@/lib/paths";
import { sortPublishedInvestors, type InvestorSort } from "@/lib/investors/queries";
import type { InvestorListItem } from "@/lib/investors/types";

type Props = {
  investors: InvestorListItem[];
};

function parseSort(raw: string | null): InvestorSort {
  if (raw === "positions") return "positions";
  if (raw === "type") return "type";
  return "name";
}

export function InvestorsList({ investors }: Props) {
  const searchParams = useSearchParams();
  const sort = parseSort(searchParams.get("sort"));

  const sorted = useMemo(() => sortPublishedInvestors(investors, sort), [investors, sort]);

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

      {sorted.length === 0 ? (
        <p className="funds-empty">No published investors yet.</p>
      ) : (
        <ul className="funds-grid">
          {sorted.map((inv) => (
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
      )}
    </>
  );
}

import Link from "next/link";
import { fundChangeBadgeClass, fundChangeLabel } from "@/lib/funds/change-label";
import { stockPath } from "@/lib/paths";
import type { FundHoldingRow } from "@/lib/funds/queries";
import { formatUsdCompact } from "@/lib/whats-new/format";

function fmtShares(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

type Props = {
  holdings: FundHoldingRow[];
  /** Tickers with a stock detail page in our tracked universe */
  linkableTickers: ReadonlySet<string>;
};

export function FundHoldingsTable({ holdings, linkableTickers }: Props) {
  const pmCount = holdings.filter((h) => h.isPreciousMetal).length;

  return (
    <>
      <p className="funds-filter-note">
        {pmCount > 0
          ? `${pmCount} holding${pmCount === 1 ? "" : "s"} highlighted as gold, silver, royalty, or PM ETF in our tracked universe.`
          : "Holdings mapped to our precious-metals security universe are highlighted when present."}
      </p>
      <div className="funds-table-wrap">
        <table className="funds-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company</th>
              <th>Shares</th>
              <th>Value</th>
              <th>%</th>
              <th>QoQ</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((row) => (
              <tr
                key={row.ticker}
                className={row.isPreciousMetal ? "funds-table__row--pm" : undefined}
              >
                <td>
                  {linkableTickers.has(row.ticker) ? (
                    <Link href={stockPath(row.ticker)} className="funds-table__ticker-link">
                      {row.ticker}
                    </Link>
                  ) : (
                    <span className="mono funds-table__ticker-muted" title="Not in tracked stock universe">
                      {row.ticker}
                    </span>
                  )}
                </td>
                <td>{row.company}</td>
                <td className="mono">{fmtShares(row.shares)}</td>
                <td className="mono">{formatUsdCompact(row.valueUsd)}</td>
                <td className="mono">
                  {row.portfolioPct != null ? `${row.portfolioPct.toFixed(1)}%` : "—"}
                </td>
                <td>
                  {row.changeType ? (
                    <span className={fundChangeBadgeClass(row.changeType)}>
                      {fundChangeLabel(row.changeType)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

import type { InsiderTransactionRow } from "@/lib/form4-insider";

function fmtShares(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function fmtUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function InsiderActivityList({ rows }: { rows: InsiderTransactionRow[] }) {
  return (
    <div className="insider-activity-table-wrap">
      <table className="insider-activity-table">
        <thead>
          <tr>
            <th scope="col">Side</th>
            <th scope="col">Date</th>
            <th scope="col">Insider</th>
            <th scope="col" className="insider-activity-table__num">
              Shares
            </th>
            <th scope="col" className="insider-activity-table__num">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.dateIso}-${row.name}-${i}`}
              className={`insider-activity-table__row insider-activity-table__row--${row.type === "BUY" ? "buy" : "sell"}`}
            >
              <td>
                <span
                  className={`insider-activity-table__side insider-activity-table__side--${row.type === "BUY" ? "buy" : "sell"}`}
                >
                  {row.type}
                </span>
              </td>
              <td>
                <time className="mono" dateTime={row.dateIso}>
                  {row.date}
                </time>
              </td>
              <td>
                <span className="insider-activity-table__name">{row.name}</span>
                {row.title ? (
                  <span className="insider-activity-table__title">{row.title}</span>
                ) : null}
              </td>
              <td className="insider-activity-table__num mono">{fmtShares(row.shares)}</td>
              <td className="insider-activity-table__num mono">{fmtUsd(row.valueUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

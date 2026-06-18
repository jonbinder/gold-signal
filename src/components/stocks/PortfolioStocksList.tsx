import Link from "next/link";
import { StockLogo } from "@/components/stocks/StockLogo";
import { portfolioPath, stockPath } from "@/lib/paths";
import type { SheetStockRow } from "@/lib/stocks/sheet-positions";

type Props = {
  stocks: SheetStockRow[];
};

export function PortfolioStocksList({ stocks }: Props) {
  if (stocks.length === 0) {
    return (
      <div className="stocks-list-empty" role="status">
        <p className="stocks-list-empty__title">No tracked stocks yet</p>
        <p className="stocks-list-empty__body">
          Stocks appear here once positions are synced from our sourced research sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="funds-table-wrap">
      <table className="funds-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Company</th>
            <th>Held by</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((row) => (
            <tr key={row.ticker}>
              <td>
                <div className="funds-table__ticker-cell">
                  <StockLogo ticker={row.ticker} tryServe size={30} />
                  <Link href={stockPath(row.ticker)} className="mono">
                    {row.ticker}
                  </Link>
                </div>
              </td>
              <td>{row.companyName}</td>
              <td>
                {row.holders.length === 0 ? (
                  <span className="funds-table__ticker-muted">—</span>
                ) : (
                  <span className="stocks-holders-list">
                    {row.holders.map((holder, index) => (
                      <span key={holder.slug}>
                        {index > 0 ? ", " : null}
                        <Link href={portfolioPath(holder.slug)}>{holder.name}</Link>
                      </span>
                    ))}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

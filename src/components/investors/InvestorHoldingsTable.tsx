import { Sparkline } from "@/components/stocks/Sparkline";
import { StockLogo } from "@/components/stocks/StockLogo";
import type { EnrichedHolding } from "@/lib/investors-data";

interface InvestorHoldingsTableProps {
  holdings: EnrichedHolding[];
}

export function InvestorHoldingsTable({ holdings }: InvestorHoldingsTableProps) {
  const lastIndex = holdings.length - 1;

  return (
    <div className="investor-profile__table-wrap">
      <table className="stocks-table investor-holdings-table">
        <thead>
          <tr>
            <th className="stocks-table__th stocks-table__th--weight" scope="col">
              % of
              <br />
              Portfolio
            </th>
            <th className="stocks-table__th stocks-table__th--name" scope="col">
              Name
            </th>
            <th className="stocks-table__th stocks-table__th--sort stocks-table__th--active" scope="col">
              ▼ Market Cap
            </th>
            <th className="stocks-table__th stocks-table__th--sort" scope="col">
              P/E Ratio
            </th>
            <th className="stocks-table__th stocks-table__th--spark" scope="col">
              1Y Price History
            </th>
            <th
              className="stocks-table__th stocks-table__th--signal"
              scope="col"
            >
              SignalScore
              <br />
              Rating
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={`${h.ticker}-${h.company}-${i}`} className="stocks-table__row">
              <td className="stocks-table__td stocks-table__td--weight">{h.estWeight}</td>
              <td className="stocks-table__td stocks-table__td--name">
                <div className="stocks-table__name-cell">
                  <StockLogo ticker={h.ticker} logoUrl={h.logoUrl} size={44} />
                  <div>
                    {h.ticker !== "—" ? (
                      <span className="stocks-table__ticker">{h.ticker}</span>
                    ) : null}
                    <span className="stocks-table__company">{h.company}</span>
                  </div>
                </div>
              </td>
              <td className="stocks-table__td stocks-table__td--num">
                {h.marketCap != null ? `${h.marketCap.toFixed(1)}B` : "—"}
              </td>
              <td className="stocks-table__td stocks-table__td--num">
                {h.peRatio != null ? h.peRatio : <span className="stocks-table__na">N/A</span>}
              </td>
              <td className="stocks-table__td stocks-table__td--spark">
                {h.priceHistory.length > 0 ? (
                  <Sparkline data={h.priceHistory} />
                ) : (
                  <span className="stocks-table__na">—</span>
                )}
              </td>
              <td
                className={`stocks-table__td stocks-table__td--signal ${i === lastIndex ? "stocks-table__td--signal-last" : ""}`}
              >
                {h.signalScore != null ? h.signalScore : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} />
            <td className="stocks-table__signal-foot" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

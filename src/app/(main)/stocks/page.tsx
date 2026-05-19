import type { Metadata } from "next";
import Link from "next/link";
import { formatMonthlyChange, getStocks } from "@/lib/goldsignal/data";
import { ScoreBadge } from "@/components/goldsignal/ScoreBadge";

export const metadata: Metadata = {
  title: "Stocks — GoldSignal.ai",
  description:
    "Gold and silver stocks ranked by SignalScore. Data synced from GoldSignal_Stocks.xlsx.",
};

export default function StocksPage() {
  const stocks = getStocks();

  return (
    <main>
      <section className="rankings" id="rankings">
        <header className="section-header section-header--dark">
          <h1 className="section-header__title">Stock Rankings</h1>
          <p className="section-header__sub">
            Gold &amp; silver equities ranked by SignalScore — edit scores in{" "}
            <span className="mono">GoldSignal_Stocks.xlsx</span> and push to refresh the site.
          </p>
        </header>
        <div className="rankings__table-wrap">
          <table className="rankings-table">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Ticker</th>
                <th scope="col">Company</th>
                <th scope="col">Sector</th>
                <th scope="col">Monthly</th>
                <th scope="col">SignalScore</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => {
                const monthly = formatMonthlyChange(stock.monthlyChange);
                return (
                  <tr key={stock.ticker} className="rankings-row fade-in visible">
                    <td className="mono">{index + 1}</td>
                    <td className="mono rankings-table__ticker">{stock.ticker}</td>
                    <td>{stock.company}</td>
                    <td>{stock.sector}</td>
                    <td className={`mono ${monthly.className}`}>{monthly.text}</td>
                    <td>
                      <ScoreBadge score={stock.signalScore} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="rankings__back">
          <Link href="/" className="btn btn--secondary">
            ← Back to home
          </Link>
        </p>
      </section>
    </main>
  );
}

import { StocksTableSkeleton } from "@/components/stocks/StocksTableSkeleton";

export default function StocksLoading() {
  return (
    <main className="stocks-list-page">
      <section className="stocks-list-hero" aria-hidden>
        <div className="stocks-list-hero__inner">
          <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 28, width: "min(320px, 80%)", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "min(480px, 95%)" }} />
        </div>
      </section>
      <div className="stocks-list-main">
        <StocksTableSkeleton />
      </div>
    </main>
  );
}

export function InvestorsGridSkeleton() {
  return (
    <div className="investors-grid-skeleton" aria-busy="true" aria-label="Loading investors">
      <div className="investors-grid-skeleton__grid">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="investors-grid-skeleton__card">
            <div className="investors-grid-skeleton__photo skeleton" />
            <div className="investors-grid-skeleton__line skeleton" style={{ width: "72%" }} />
            <div className="investors-grid-skeleton__line skeleton" style={{ width: "48%" }} />
            <div className="investors-grid-skeleton__line skeleton" style={{ width: "36%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

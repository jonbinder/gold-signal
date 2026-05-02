export function SegmentLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "48px 24px",
        minHeight: 240,
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="skeleton" style={{ height: 4, width: "min(320px, 100%)", marginBottom: 24 }} />
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: 56,
              borderRadius: 8,
              opacity: 0.85 - i * 0.12,
            }}
          />
        ))}
      </div>
    </div>
  );
}

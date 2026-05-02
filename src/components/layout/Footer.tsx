export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-dim)",
        marginTop: 80,
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
        }}
      >
        GOLDSIGNAL · Holdings data sourced from SEC 13F filings · Not financial advice
      </p>
      <p style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
        Data may be delayed up to 45 days after quarter end
      </p>
    </footer>
  );
}

"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ reset }: ErrorPageProps) {
  return (
    <div
      style={{
        maxWidth: 520,
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          marginBottom: 12,
        }}
      >
        Something went wrong
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
        We could not load this page. You can try again or return home.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "12px 22px",
            borderRadius: 8,
            border: "1px solid var(--border-mid)",
            background: "var(--bg-raised)",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 22px",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--gold-400), var(--gold-300))",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}

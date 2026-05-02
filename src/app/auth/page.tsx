import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign In" };

export default function AuthPage() {
  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-dim)",
          borderRadius: 16,
          padding: "40px 36px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, var(--gold-400), var(--gold-300))",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 20,
              color: "#080808",
              margin: "0 auto 16px",
            }}
          >
            GS
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              marginBottom: 6,
            }}
          >
            Sign in to GoldSignal
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Track smart money in gold & silver
          </p>
        </div>

        {/* Auth placeholder — wire up Supabase Auth UI or magic link here */}
        <div
          style={{
            border: "1px dashed var(--border-mid)",
            borderRadius: 10,
            padding: "28px 20px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
            🔧 Auth integration placeholder
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Install{" "}
            <code
              style={{
                background: "var(--bg-overlay)",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              @supabase/auth-ui-react
            </code>{" "}
            and replace this block with the{" "}
            <code
              style={{
                background: "var(--bg-overlay)",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              {"<Auth>"}
            </code>{" "}
            component.
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-raised)",
            borderRadius: 8,
            padding: "14px 16px",
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.7,
            fontFamily: "var(--font-mono)",
          }}
        >
          <div style={{ marginBottom: 4, color: "var(--text-secondary)" }}>
            # To enable auth:
          </div>
          <div>npm i @supabase/auth-ui-react</div>
          <div>npm i @supabase/auth-ui-shared</div>
          <div style={{ marginTop: 8 }}>
            Then configure Supabase Auth in dashboard
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            ← Back to GoldSignal
          </Link>
        </div>
      </div>
    </div>
  );
}

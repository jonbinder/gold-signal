"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/investors", label: "Investors" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, var(--gold-400), var(--gold-300))",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 13,
              color: "#080808",
              flexShrink: 0,
            }}
          >
            GS
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Gold<span style={{ color: "var(--text-gold)" }}>Signal</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? "var(--text-gold)" : "var(--text-secondary)",
                  background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                  transition: "all 0.15s",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Auth placeholder */}
          <Link
            href="/auth"
            style={{
              marginLeft: 8,
              padding: "6px 16px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-mono)",
              color: "var(--gold-400)",
              border: "1px solid var(--border-mid)",
              background: "rgba(201,168,76,0.06)",
              letterSpacing: "0.03em",
              transition: "all 0.15s",
            }}
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}

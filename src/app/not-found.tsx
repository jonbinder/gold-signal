import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/goldsignal/SiteNav";
import { SiteFooter } from "@/components/goldsignal/SiteFooter";
import { SITE_TAGLINE } from "@/lib/site";
import "./site-cohesion.css";

export const metadata: Metadata = {
  title: "Page not found — GoldSignal.ai",
  description: `${SITE_TAGLINE}. Browse portfolios and SEC filing activity.`,
};

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="home-page home-page--whats-new" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", margin: "0 0 0.5rem" }}>
          Page not found
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "28rem", margin: "0 auto 1.5rem" }}>
          That URL isn&apos;t in our tracked universe. Try the homepage or portfolios directory.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", justifyContent: "center" }}>
          <Link href="/" className="btn btn--cta">
            Home
          </Link>
          <Link href="/portfolios" className="btn btn--secondary">
            Portfolios
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

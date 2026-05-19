import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <Link href="/" className="footer__logo">
        Gold<span className="nav__logo-accent">Signal</span>.ai
      </Link>
      <p className="footer__source">
        Data sourced from SEC EDGAR 13F/Form 4 filings, exchange feeds, and consensus estimates.
        Not investment advice.
      </p>
      <p className="footer__copy mono">&copy; 2026 GoldSignal.ai. All rights reserved.</p>
    </footer>
  );
}

import Link from "next/link";
import { SITE_NAV_LINKS } from "@/lib/goldsignal/nav-links";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <Link href="/" className="footer__logo">
          Gold<span className="nav__logo-accent">Signal</span>.ai
        </Link>
        <nav className="footer__nav" aria-label="Footer">
          <ul className="footer__links">
            {SITE_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="footer__source">
        Data sourced from SEC EDGAR 13F/Form 4 filings, exchange feeds, and consensus estimates.
        Not investment advice.
      </p>
      <p className="footer__copy mono">&copy; 2026 GoldSignal.ai. All rights reserved.</p>
    </footer>
  );
}

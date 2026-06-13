import Link from "next/link";
import { GoldWisdomQuote } from "@/components/home/GoldWisdomQuote";
import { SITE_NAV_LINKS } from "@/lib/goldsignal/nav-links";
import { COMPLIANCE_LINE, SITE_TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <Link href="/" className="footer__logo">
          Gold<span className="nav__logo-accent">Signal</span>.ai
        </Link>
        <p className="footer__tagline">{SITE_TAGLINE}</p>
        <nav className="footer__nav" aria-label="Footer">
          <ul className="footer__links">
            {SITE_NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer__quote">
          <GoldWisdomQuote />
        </div>
      </div>
      <p className="footer__source">{COMPLIANCE_LINE}</p>
      <p className="footer__copy mono">&copy; 2026 GoldSignal.ai. All rights reserved.</p>
    </footer>
  );
}

import Link from "next/link";

const NAV_LINKS = [
  { href: "/investors", label: "Investors" },
  { href: "/stocks", label: "Stocks" },
  { href: "/signalscore", label: "SignalScore" },
] as const;

export function SiteNav() {
  return (
    <nav className="nav" id="nav" aria-label="Main">
      <Link href="/" className="nav__logo">
        <span className="nav__logo-ink">Gold</span>
        <span className="nav__logo-accent">Signal</span>
        <span className="nav__logo-ink">.ai</span>
      </Link>
      <ul className="nav__links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
      <Link href="/#portfolio-review" className="btn btn--cta nav__cta">
        Free Portfolio Review
      </Link>
    </nav>
  );
}

import Link from "next/link";

const NAV_LINKS = [
  { href: "/funds", label: "Funds" },
  { href: "/stocks", label: "Stocks" },
  { href: "/signalscore", label: "About" },
] as const;

/** Legacy header — same inline nav as SiteNav (no hamburger). */
export function HomeHeader() {
  return (
    <header className="nav" aria-label="Main">
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
    </header>
  );
}

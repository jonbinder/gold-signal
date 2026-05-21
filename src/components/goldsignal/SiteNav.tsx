"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/investors", label: "Investors" },
  { href: "/stocks", label: "Stocks" },
  { href: "/signalscore", label: "SignalScore" },
] as const;

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="nav" id="nav" aria-label="Main">
        <Link href="/" className="nav__logo" onClick={() => setMenuOpen(false)}>
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
        <button
          type="button"
          className="nav__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="nav-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav__menu-icon" aria-hidden="true" />
        </button>
        <Link href="/#portfolio-review" className="btn btn--cta nav__cta">
          Free Portfolio Review
        </Link>
      </nav>

      <div
        id="nav-mobile-menu"
        className={`nav__overlay ${menuOpen ? "nav__overlay--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="nav__overlay-backdrop" onClick={() => setMenuOpen(false)} />
        <div className="nav__overlay-panel" role="dialog" aria-modal="true" aria-label="Menu">
          <ul className="nav__overlay-links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#portfolio-review" className="nav__overlay-cta" onClick={() => setMenuOpen(false)}>
                Free Portfolio Review
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

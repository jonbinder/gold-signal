"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/investors", label: "Investors" },
  { href: "/stocks", label: "Stocks" },
  { href: "/signalscore", label: "SignalScore" },
] as const;

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu]);

  return (
    <>
      <nav className="nav" id="nav" aria-label="Main">
        <Link href="/" className="nav__logo" onClick={closeMenu}>
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
          className={`nav__menu-btn hamburger ${menuOpen ? "is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="nav-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
        <Link href="/#portfolio-review" className="btn btn--cta nav__cta">
          Free Portfolio Review
        </Link>
      </nav>

      <div
        id="nav-mobile-menu"
        className={`nav__overlay ${menuOpen ? "nav__overlay--open is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="nav__close"
          aria-label="Close menu"
          onClick={closeMenu}
        >
          ✕
        </button>
        <ul className="nav__overlay-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={closeMenu}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

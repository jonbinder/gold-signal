"use client";

import "./StockLogo.css";
import { useState } from "react";
import Image from "next/image";
import { normalizeClientLogoUrl, stockLogoServePath } from "@/lib/stock-branding";

interface StockLogoProps {
  ticker: string;
  logoUrl?: string | null;
  /** When set, tries proxied logo even if logoUrl is empty (use sparingly). */
  tryServe?: boolean;
  subCategory?: string;
  size?: number;
  className?: string;
}

function resolveSrc(
  ticker: string,
  logoUrl: string | null | undefined,
  tryServe: boolean,
): string | null {
  const normalized = normalizeClientLogoUrl(logoUrl, ticker);
  if (normalized) return normalized;
  if (tryServe) return stockLogoServePath(ticker);
  return null;
}

export function StockLogo({
  ticker,
  logoUrl,
  tryServe = false,
  subCategory = "gold",
  size = 48,
  className = "",
}: StockLogoProps) {
  const [failed, setFailed] = useState(false);
  const sym = ticker.trim().toUpperCase();
  const src = resolveSrc(sym, logoUrl, tryServe);
  const letter = sym.charAt(0) || "?";
  const metalClass = subCategory === "silver" ? "stock-logo__tile--silver" : "stock-logo__tile--gold";

  if (!src || failed) {
    return (
      <div
        className={`stock-logo stock-logo__tile ${metalClass} ${className}`.trim()}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {letter}
      </div>
    );
  }

  return (
    <div
      className={`stock-logo stock-logo__frame ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        onError={() => setFailed(true)}
        style={{ objectFit: "contain", width: "100%", height: "100%" }}
      />
    </div>
  );
}

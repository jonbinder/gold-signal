"use client";

import { useState } from "react";
import Image from "next/image";

interface StockLogoProps {
  ticker: string;
  logoUrl: string;
  size?: number;
}

export function StockLogo({ ticker, logoUrl, size = 48 }: StockLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = ticker.slice(0, 3).toUpperCase();

  if (!logoUrl || failed) {
    return (
      <div className="stocks-logo stocks-logo--fallback" style={{ width: size, height: size }} aria-hidden="true">
        {initials}
      </div>
    );
  }

  return (
    <div className="stocks-logo" style={{ width: size, height: size }} aria-hidden="true">
      <Image
        src={logoUrl}
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

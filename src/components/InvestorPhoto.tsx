"use client";

import { useState } from "react";
import Image from "next/image";

const GOLD = "#B8860B";
const NAVY = "#11151F";

export type InvestorPhotoInvestor = {
  name: string;
  slug: string;
  photoUrl?: string | null;
};

type InvestorPhotoProps = {
  investor: InvestorPhotoInvestor;
  size: "thumb" | "hero";
  className?: string;
  priority?: boolean;
};

const PIXEL_SIZE = { thumb: 56, hero: 180 } as const;
const BORDER_PX = { thumb: 2, hero: 3 } as const;

function firstInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function InitialFallback({
  name,
  pixelSize,
  borderPx,
  className,
}: {
  name: string;
  pixelSize: number;
  borderPx: number;
  className: string;
}) {
  return (
    <span
      className={`investor-photo investor-photo--fallback tabular-nums ${className}`.trim()}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: "50%",
        border: `${borderPx}px solid ${GOLD}`,
        background: NAVY,
        color: GOLD,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: pixelSize * 0.42,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {firstInitial(name)}
    </span>
  );
}

export function InvestorPhoto({ investor, size, className = "", priority = false }: InvestorPhotoProps) {
  const pixelSize = PIXEL_SIZE[size];
  const borderPx = BORDER_PX[size];
  const src = investor.photoUrl?.trim() || `/investor-photos/${investor.slug}.webp`;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <InitialFallback
        name={investor.name}
        pixelSize={pixelSize}
        borderPx={borderPx}
        className={className}
      />
    );
  }

  return (
    <span
      className={`investor-photo investor-photo--image ${className}`.trim()}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: "50%",
        border: `${borderPx}px solid ${GOLD}`,
        overflow: "hidden",
        display: "inline-flex",
        flexShrink: 0,
        background: NAVY,
      }}
    >
      <Image
        src={src}
        alt=""
        width={pixelSize}
        height={pixelSize}
        priority={priority}
        sizes={size === "hero" ? "(max-width: 640px) 128px, 180px" : "56px"}
        onError={() => setFailed(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
        }}
      />
    </span>
  );
}

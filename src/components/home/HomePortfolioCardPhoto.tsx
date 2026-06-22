"use client";

import { useState } from "react";
import Image from "next/image";

/** Display + request size — keeps Next from serving 4K variants on phones. */
const PHOTO_PX = 112;

type HomePortfolioCardPhotoProps = {
  name: string;
  slug: string;
  photoUrl?: string | null;
  priority?: boolean;
  className?: string;
};

function investorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function HomePortfolioCardPhoto({
  name,
  slug,
  photoUrl,
  priority = false,
  className = "",
}: HomePortfolioCardPhotoProps) {
  const src = photoUrl?.trim() || `/investor-photos/${slug}.webp`;
  const [failed, setFailed] = useState(false);
  const isTile = className.includes("home-portfolio-tile__photo");
  const pixelSize = isTile ? 320 : PHOTO_PX;

  if (failed) {
    return (
      <div
        className={`home-portfolio-card__photo home-portfolio-card__photo--fallback ${className}`.trim()}
        aria-hidden="true"
      >
        <span className="home-portfolio-card__initials">{investorInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className={`home-portfolio-card__photo ${className}`.trim()}>
      <Image
        src={src}
        alt=""
        width={pixelSize}
        height={pixelSize}
        priority={priority}
        sizes={
          isTile
            ? "(max-width: 720px) 45vw, 320px"
            : "(max-width: 640px) 128px, (max-width: 1024px) 160px, 200px"
        }
        onError={() => setFailed(true)}
        className="home-portfolio-card__image"
      />
    </div>
  );
}

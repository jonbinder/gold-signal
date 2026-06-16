"use client";

import { useState } from "react";
import Image from "next/image";

/** Display + request size — keeps Next from serving 4K variants on phones. */
const PHOTO_PX = 112;

type HomePortfolioCardPhotoProps = {
  name: string;
  slug: string;
  priority?: boolean;
};

function investorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function HomePortfolioCardPhoto({ name, slug, priority = false }: HomePortfolioCardPhotoProps) {
  const src = `/investor-photos/${slug}.webp`;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="home-portfolio-card__photo home-portfolio-card__photo--fallback" aria-hidden="true">
        <span className="home-portfolio-card__initials">{investorInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className="home-portfolio-card__photo">
      <Image
        src={src}
        alt=""
        width={PHOTO_PX}
        height={PHOTO_PX}
        priority={priority}
        sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 200px"
        onError={() => setFailed(true)}
        className="home-portfolio-card__image"
      />
    </div>
  );
}

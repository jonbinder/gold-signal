"use client";

import { useState } from "react";
import Image from "next/image";

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
        fill
        priority={priority}
        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
        onError={() => setFailed(true)}
        className="home-portfolio-card__image"
      />
    </div>
  );
}

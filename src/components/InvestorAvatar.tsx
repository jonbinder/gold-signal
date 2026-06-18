"use client";

import { useState } from "react";
import Image from "next/image";
import { investorInitials } from "@/lib/investor-initials";
import { investorImages } from "@/lib/investor-images";

interface InvestorAvatarProps {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}

export function InvestorAvatar({ slug, name, size = 48, className = "" }: InvestorAvatarProps) {
  const mappedSrc = investorImages[slug] ?? `/investor-photos/${slug}.webp`;
  const [failed, setFailed] = useState(false);
  const src = mappedSrc && !failed ? mappedSrc : null;
  const initials = investorInitials(name);

  if (src) {
    return (
      <div
        className={`investor-avatar ${className}`}
        style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}
        aria-hidden="true"
      >
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{
            objectFit: "cover",
            objectPosition: "center top",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`investor-avatar investor-avatar--initials mono ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gold-pale)",
        color: "var(--gold-dim)",
        fontWeight: 500,
        fontSize: size * 0.3,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

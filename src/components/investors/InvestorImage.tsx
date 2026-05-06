"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const UNKNOWN_INVESTOR_IMAGE = "/investors/unknown.jpg";

type InvestorImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export function InvestorImage({ src, alt, width, height, sizes, className, priority = false }: InvestorImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      unoptimized
      className={className}
      // Fallback chain: bad JSON path, missing file, or runtime image load failure -> /investors/unknown.jpg
      onError={() => setCurrentSrc(UNKNOWN_INVESTOR_IMAGE)}
    />
  );
}

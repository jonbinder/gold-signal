import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
};

export function BrandLogo({ className, imageClassName, priority = false, sizes = "240px" }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="GoldSignal home"
      className={cn("inline-flex items-center no-underline focus-visible:outline-none", className)}
    >
      <Image
        src="/brand/goldsignal-logo.png"
        alt="GoldSignal logo with Holdings Intelligence tagline"
        width={802}
        height={217}
        priority={priority}
        sizes={sizes}
        className={cn("h-auto w-full max-w-[220px] bg-transparent object-contain", imageClassName)}
      />
    </Link>
  );
}

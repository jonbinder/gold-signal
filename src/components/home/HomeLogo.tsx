import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function HomeLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 no-underline", className)} aria-label="GoldSignal home">
      <Image
        src="/icon.png"
        alt=""
        width={40}
        height={40}
        className="size-9 shrink-0 rounded-full sm:size-10"
        priority
      />
      <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
        <span className="text-[var(--gold)]">GOLD</span>
        <span className="text-white">SIGNAL</span>
        <span className="text-[var(--gold)]">.ai</span>
      </span>
    </Link>
  );
}

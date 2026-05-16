import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeFeatureIcons } from "@/components/home/HomeFeatureIcons";
import { HomeMobileQuote } from "@/components/home/HomeMobileQuote";

const HERO_IMAGE = "/investors/Investors-homepage.png";

function HeroCopy({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]">
        <span className="block">Follow the</span>
        <span className="block">Smart Money</span>
        <span className="block text-[var(--gold)]">in Gold and Silver</span>
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg lg:mt-6 lg:max-w-lg">
        Track the Portfolios of the World&apos;s
        <br className="hidden sm:block" />
        Top Gold and Silver Stock Investors.
      </p>
      <Link
        href="/investors"
        className="home-cta mt-7 inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-8 py-4 text-base font-bold text-[var(--bg-primary)] no-underline transition-colors hover:bg-[var(--gold-light)] lg:mt-9"
      >
        View Investors
        <ArrowRight className="size-5" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}

export function HomeHero() {
  return (
    <>
      {/* Desktop / tablet: full-bleed background hero */}
      <section
        className="relative hidden min-h-[calc(100dvh-7.5rem)] bg-[var(--bg-primary)] bg-cover bg-[center_top] bg-no-repeat md:block lg:min-h-[calc(100dvh-6.5rem)]"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-label="Hero"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.1) 100%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[inherit] max-w-[1400px] items-center px-6 py-16 lg:px-10 lg:py-20">
          <HeroCopy className="w-full max-w-2xl lg:max-w-[42%]" />
        </div>
      </section>

      {/* Mobile: stacked layout */}
      <section className="md:hidden" aria-label="Hero">
        <div className="px-4 pb-2 pt-6 sm:px-6">
          <HeroCopy />
          <HomeFeatureIcons />
        </div>
        <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5]">
          <Image
            src={HERO_IMAGE}
            alt="Gold and silver investors reviewing portfolio holdings"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="px-4 py-5 sm:px-6">
          <HomeMobileQuote />
        </div>
      </section>
    </>
  );
}


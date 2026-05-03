"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ reset }: ErrorPageProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:py-28">
      <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        We could not load this page. You can try again or return home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="gold" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

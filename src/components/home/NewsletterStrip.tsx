"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewsletterStrip() {
  return (
    <section className="border-t border-navy-800 bg-navy-800 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
        <p className="max-w-sm text-sm font-bold uppercase leading-snug tracking-wide text-white sm:text-base">
          Subscribe for filing alerts
        </p>
        <form
          className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="sr-only" htmlFor="nl-name">
            Name
          </label>
          <input
            id="nl-name"
            name="name"
            placeholder="Name"
            className="h-11 flex-1 rounded-sm border border-dashed border-white/50 bg-transparent px-3 text-sm text-white placeholder:text-navy-200 outline-none focus:border-gold-400"
          />
          <label className="sr-only" htmlFor="nl-email">
            Email
          </label>
          <input
            id="nl-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            className="h-11 flex-1 rounded-sm border border-dashed border-white/50 bg-transparent px-3 text-sm text-white placeholder:text-navy-200 outline-none focus:border-gold-400"
          />
          <Button type="submit" variant="gold" className="h-11 shrink-0 px-6 text-navy-950">
            Submit
            <ArrowRight className="size-4 text-navy-950" />
          </Button>
        </form>
      </div>
    </section>
  );
}

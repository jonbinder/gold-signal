"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function WaitlistSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data = (await res.json()) as { success?: boolean };
      if (data.success) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="waitlist-page">
      <Link href="/" className="waitlist-page__back">
        ← GoldSignal.ai
      </Link>

      <div className="waitlist-page__inner">
        <Link href="/" className="waitlist-page__logo">
          <span>Gold</span>
          <span className="waitlist-page__logo-accent">Signal</span>
          <span>.ai</span>
        </Link>

        <h1 className="waitlist-page__title">Get Early Access to GoldSignal</h1>
        <p className="waitlist-page__sub">
          GoldSignal tracks elite precious metals investors, sourced directly from SEC filings, company
          disclosures, and announced holdings. Join the waitlist to be notified when login is available to
          non members.
        </p>

        {submitted ? (
          <p className="waitlist-page__confirm">You&apos;re on the list. We&apos;ll be in touch.</p>
        ) : (
          <>
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <div className="waitlist-form__row">
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  className="waitlist-form__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="waitlist-form__submit" disabled={submitting}>
                  Join the Waitlist
                </button>
              </div>
              {error ? <p className="waitlist-form__error">{error}</p> : null}
            </form>
            <p className="waitlist-page__note">No spam. Just signal.</p>
          </>
        )}
      </div>
    </div>
  );
}

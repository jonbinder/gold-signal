"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const EMAIL_ERROR = "Email address is invalid";

export function AuthLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(EMAIL_ERROR);
  }

  return (
    <div className="auth-card">
      <Link href="/" className="auth-card__logo">
        <span>Gold</span>
        <span className="auth-card__logo-accent">Signal</span>
        <span>.ai</span>
      </Link>

      <h1 className="auth-card__title">Sign in to GoldSignal</h1>
      <p className="auth-card__sub">The smart money in gold and silver</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="auth-email">
            Email Address
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            className="auth-field__input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
          />
          {emailError ? <p className="auth-field__error">{emailError}</p> : null}
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="auth-field__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="auth-submit">
          Sign In
        </button>
      </form>

      <p className="auth-waitlist">
        Don&apos;t have an account?{" "}
        <Link href="/waitlist" className="auth-waitlist__link">
          Join the waitlist
        </Link>
      </p>

      <div className="auth-back">
        <Link href="/" className="auth-back__link">
          ← Back to GoldSignal
        </Link>
      </div>
    </div>
  );
}

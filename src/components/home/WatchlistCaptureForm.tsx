"use client";

import { useState } from "react";

export function WatchlistCaptureForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const stocksWatching = (form.elements.namedItem("stocksWatching") as HTMLTextAreaElement).value.trim();

    if (!name || !email || !stocksWatching) {
      setStatus("error");
      setMessage("Please fill in all fields.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, stocksWatching }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(payload.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(
        (payload as { message?: string }).message ??
          "Your filing readout is on its way — check your inbox in a few minutes.",
      );
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form id="portfolio-review" className="whats-new-capture" onSubmit={onSubmit} noValidate>
      <div className="whats-new-capture__fields">
        <label className="whats-new-capture__field">
          <span className="whats-new-capture__label">Name</span>
          <input type="text" name="name" required autoComplete="name" placeholder="Your name" />
        </label>
        <label className="whats-new-capture__field">
          <span className="whats-new-capture__label">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
          />
        </label>
      </div>
      <label className="whats-new-capture__field whats-new-capture__field--full">
        <span className="whats-new-capture__label">Stocks you&apos;re watching</span>
        <textarea
          name="stocksWatching"
          rows={2}
          required
          placeholder="NEM, WPM, AG, HL…"
        />
      </label>
      <button
        type="submit"
        className="btn btn--submit whats-new-capture__submit"
        disabled={status === "submitting" || status === "success"}
      >
        {status === "submitting" ? "Saving…" : status === "success" ? "Signed up" : "Get the readout"}
      </button>
      {message ? (
        <p
          className={`whats-new-capture__message ${status === "error" ? "whats-new-capture__message--error" : "whats-new-capture__message--ok"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : (
        <p className="whats-new-capture__hint">Free. Facts from public SEC filings — no spam.</p>
      )}
    </form>
  );
}

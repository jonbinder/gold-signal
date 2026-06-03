"use client";

import { useCallback, useState } from "react";
import { pickRandomGoldQuote, type GoldQuote } from "@/data/gold-quotes";

export function GoldWisdomQuote() {
  const [quote, setQuote] = useState<GoldQuote>(() => pickRandomGoldQuote());

  const showAnother = useCallback(() => {
    setQuote((current) => pickRandomGoldQuote(current.id));
  }, []);

  return (
    <figure className="home-gold-wisdom" aria-label="Gold wisdom">
      <div className="home-gold-wisdom__head">
        <span className="home-gold-wisdom__mark" aria-hidden>
          &ldquo;
        </span>
        <span className="home-gold-wisdom__label">Gold Wisdom</span>
        <span className="home-gold-wisdom__rule" aria-hidden />
      </div>
      <blockquote className="home-gold-wisdom__quote">
        <p>{quote.text}</p>
      </blockquote>
      <figcaption className="home-gold-wisdom__attrib">
        <cite className="home-gold-wisdom__author">{quote.author}</cite>
        {quote.source ? <span className="home-gold-wisdom__source">{quote.source}</span> : null}
      </figcaption>
      <button type="button" className="home-gold-wisdom__another" onClick={showAnother}>
        Another quote
      </button>
    </figure>
  );
}

import Link from "next/link";
import { stockPath } from "@/lib/paths";
import { getTeachingSnippet } from "@/lib/whats-new/teaching-snippets";
import type { FeedActivityKind, WhatsNewFeed, WhatsNewFeedItem } from "@/lib/whats-new/types";

const KIND_LABELS: Record<FeedActivityKind, string> = {
  insider_buy: "Insider buy",
  insider_sell: "Insider sell",
  stake_13d: "New 13D stake",
  stake_13g: "New 13G stake",
  institutional: "13F move",
};

function kindClass(kind: FeedActivityKind): string {
  if (kind === "insider_buy") return "whats-new-card--buy";
  if (kind === "insider_sell") return "whats-new-card--sell";
  if (kind === "stake_13d" || kind === "stake_13g") return "whats-new-card--stake";
  return "whats-new-card--institutional";
}

function FeedCard({ item, featured = false }: { item: WhatsNewFeedItem; featured?: boolean }) {
  return (
    <article className={`whats-new-card ${kindClass(item.kind)} ${featured ? "whats-new-card--lead" : ""}`}>
      <div className="whats-new-card__meta">
        <span className={`whats-new-card__badge whats-new-card__badge--${item.kind}`}>
          {KIND_LABELS[item.kind]}
        </span>
        <time className="whats-new-card__date mono" dateTime={item.filingDate}>
          {item.filingDateLabel}
        </time>
      </div>
      <h3 className="whats-new-card__title">
        <Link href={stockPath(item.ticker)} className="whats-new-card__ticker-link">
          <span className="whats-new-card__ticker mono">{item.ticker}</span>
        </Link>
        <span className="whats-new-card__company">{item.companyName}</span>
      </h3>
      <p className="whats-new-card__headline">{item.headline}</p>
      {item.subline ? <p className="whats-new-card__subline">{item.subline}</p> : null}
    </article>
  );
}

function FeedSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: WhatsNewFeedItem[];
  emptyMessage: string;
}) {
  return (
    <section className="whats-new-section" aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <h2 id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`} className="whats-new-section__title">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="whats-new-section__empty">{emptyMessage}</p>
      ) : (
        <ul className="whats-new-section__list">
          {items.map((item) => (
            <li key={item.id}>
              <FeedCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function WhatsNewFeed({ feed }: { feed: WhatsNewFeed }) {
  const windowLabel = new Date(`${feed.windowStart}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const windowEndLabel = new Date(`${feed.windowEnd}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="whats-new-feed">
      <header className="whats-new-feed__header">
        <p className="whats-new-feed__eyebrow mono">What&apos;s new</p>
        <h2 className="whats-new-feed__title">Last 7 days of filing activity</h2>
        <p className="whats-new-feed__range">
          {windowLabel} – {windowEndLabel} · gold &amp; silver universe
        </p>
      </header>

      {feed.lead ? (
        <div className="whats-new-lead">
          <p className="whats-new-lead__label">Lead story</p>
          <FeedCard item={feed.lead} featured />
          <p className="whats-new-lead__teaching">
            <span className="whats-new-lead__teaching-label">Why it matters</span>
            {getTeachingSnippet(feed.lead.teachingSnippetKey)}
          </p>
        </div>
      ) : (
        <p className="whats-new-section__empty whats-new-feed__no-lead">
          No standout filings in the last 7 days yet — check back after the next data refresh.
        </p>
      )}

      <div className="whats-new-feed__grouped">
        <FeedSection
          title="Notable insider buys"
          items={feed.sections.insiderBuys.filter((i) => i.id !== feed.lead?.id)}
          emptyMessage="No notable open-market insider buys filed this week."
        />
        <FeedSection
          title="Large stakes (13D / 13G)"
          items={feed.sections.largeStakes.filter((i) => i.id !== feed.lead?.id)}
          emptyMessage="No new large stakes filed this week."
        />
        <FeedSection
          title="Institutional moves (13F)"
          items={feed.sections.institutional.filter((i) => i.id !== feed.lead?.id)}
          emptyMessage="No notable 13F position changes filed this week."
        />
        {feed.sections.insiderSells.length > 0 ? (
          <FeedSection
            title="Insider sales"
            items={feed.sections.insiderSells.filter((i) => i.id !== feed.lead?.id)}
            emptyMessage=""
          />
        ) : null}
      </div>

      {feed.usedSampleStakes ? (
        <p className="whats-new-feed__sample-note mono">
          Sample 13D/13G rows shown from dev seed data until the EDGAR stake pipeline fills this section.
        </p>
      ) : null}
    </div>
  );
}

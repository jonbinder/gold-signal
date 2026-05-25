# SignalScore Portfolio Review — Architecture

## Overview

Users submit a portfolio on the homepage (`/#portfolio-review`). Processing starts immediately via a fire-and-forget internal call; a daily cron retries anything stuck.

```
Homepage form
    → POST /api/submissions (insert pending, return success)
    → fire-and-forget GET /api/process-one?submissionId=… (x-process-secret)
    → claim pending → processing
    → rank tickers (Polygon + SEC + famous_investors)
    → stock_rankings rows + portfolio grade
    → PDF → Supabase Storage (reports bucket)
    → Resend email with attachment
    → submissions.status = completed

Daily safety net (06:00 UTC, Hobby cron limit):
    → GET /api/cron/cleanup (CRON_SECRET)
    → pending/processing stuck > 30 min → fire-and-forget /api/process-one for each
```

## Key modules

| Path | Role |
|------|------|
| `src/app/components/GoldSignalClient.tsx` | Form submit handler |
| `src/lib/portfolio-submission.ts` | Validate/sanitize payload |
| `src/app/api/submissions/route.ts` | Create pending submission + trigger processing |
| `src/app/api/process-one/route.ts` | Process one submission (internal) |
| `src/app/api/cron/cleanup/route.ts` | Daily stuck-queue safety net |
| `src/lib/trigger-process-one.ts` | Fire-and-forget fetch helper |
| `src/lib/submission-processor.ts` | Claim, rank, PDF, email |
| `src/lib/ranking.ts` | Seven-signal scoring engine |
| `src/lib/polygon.ts` | Market data API client |
| `src/lib/sec-edgar.ts` | SEC fallback (insider metadata; institutional search unused in ranking) |
| `src/lib/pdf/SignalScoreReport.tsx` | PDF layout |
| `src/lib/email/send-report-email.ts` | Resend delivery |

## Database (Supabase)

- `submissions` — queue + portfolio summary + pdf_url
- `stock_rankings` — per-ticker scores (FK cascade delete)
- `famous_investors` — manual 13F-style holdings list (seeded from JSON)

Migrations: `005_*`, `006_*` (storage), `007_*` (queue hardening).

## Operations

See [PORTFOLIO_REVIEW_DEPLOYMENT.md](./PORTFOLIO_REVIEW_DEPLOYMENT.md) for env vars, smoke tests, and troubleshooting.

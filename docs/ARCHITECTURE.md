# SignalScore Portfolio Review — Architecture

## Overview

Users submit a portfolio on the homepage (`/#portfolio-review`). A background worker ranks each ticker, builds a PDF, and emails it via Resend.

```
Homepage form
    → POST /api/submissions (pending row in Supabase)
    → Vercel cron daily (14:00 UTC on Hobby): GET /api/cron/process-submissions — or manual trigger
    → rank tickers (Polygon + SEC + famous_investors)
    → stock_rankings rows + portfolio grade
    → PDF → Supabase Storage (reports bucket)
    → Resend email with attachment
    → submissions.status = completed
```

## Key modules

| Path | Role |
|------|------|
| `src/app/components/GoldSignalClient.tsx` | Form submit handler |
| `src/lib/portfolio-submission.ts` | Validate/sanitize payload |
| `src/app/api/submissions/route.ts` | Create pending submission |
| `src/lib/submission-processor.ts` | Claim queue, rank, PDF, email |
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

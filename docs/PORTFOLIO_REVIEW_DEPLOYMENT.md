# SignalScore Portfolio Review — Deployment Guide

End-to-end pipeline: homepage form → instant fire-and-forget processing → daily cleanup safety net.

## Environment variables (Vercel + `.env.local`)

| Variable | Where to get it | Notes |
|----------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Secret** — server only |
| `POLYGON_API_KEY` | [Polygon.io](https://polygon.io) or Massive dashboard | **Secret** — server only |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys | **Secret** |
| `PROCESS_SECRET` | Generate: `openssl rand -hex 32` | **Secret** — `x-process-secret` for `/api/process-one` (submissions + cleanup triggers) |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` | **Secret** — `Authorization: Bearer` for `/api/cron/cleanup` |
| `SEC_EDGAR_USER_AGENT` | Optional | Default: `GoldSignal.ai reports@goldsignal.ai` |
| `POLYGON_REST_BASE_URL` | Optional | Default: `https://api.polygon.io` |

## Supabase setup

1. Run migrations (SQL editor or CLI):
   - `005_portfolio_review_submissions.sql`
   - `006_reports_storage_bucket.sql` (or `010_create_reports_storage_bucket.sql`)
   - `007_submission_queue_hardening.sql`
   - `009_submissions_anon_insert.sql` (required if server uses anon fallback for form insert)
2. Confirm Storage bucket **reports** exists (private, PDF only).
3. Seed famous investors (optional but improves scores):
   ```bash
   npm run seed:famous-investors
   ```

## Resend — domain verification (goldsignal.ai)

1. Resend dashboard → **Domains** → Add `goldsignal.ai`
2. Add the DNS records Resend provides (SPF, DKIM, etc.) at your DNS host
3. Wait for status **Verified**
4. Sender used by the app: `reports@goldsignal.ai`
5. Create an API key with **Sending access** and set `RESEND_API_KEY` in Vercel

## Vercel (Hobby)

1. Add all environment variables above (Production + Preview as needed).
2. Deploy — `vercel.json` registers one daily cron: **`0 6 * * *`** (06:00 UTC) on `/api/cron/cleanup`.
3. On submit, `/api/submissions` immediately fire-and-forgets `/api/process-one` (no cron wait).
4. **Function timeout:** `maxDuration: 60` on `process-one`, `refresh-stocks`, and `cleanup` (Hobby max). Prefer ≤3 tickers per submission.
5. **Stock universe:** Run migration `008_stock_data_cache.sql`. Build list with `npm run build:universe`. Daily cleanup cron chains `/api/refresh-stocks` batches.

## End-to-end test checklist

- [ ] Submit test portfolio at `https://goldsignal.ai/#portfolio-review` (or local)
- [ ] Row appears in Supabase `submissions` with `status = pending`, then moves to `processing` → `completed` within a few minutes
- [ ] Or trigger manually:
  ```bash
  curl -H "x-process-secret: YOUR_PROCESS_SECRET" "https://goldsignal.ai/api/process-one?submissionId=SUBMISSION_UUID"
  ```
- [ ] `submissions.status` → `completed`, `portfolio_score` and `portfolio_grade` set
- [ ] `stock_rankings` has one row per ticker with sub-scores
- [ ] Storage bucket `reports/{submission_id}/signalscore-report.pdf` exists
- [ ] `submissions.pdf_url` is a signed URL
- [ ] Email arrives at inbox with PDF attached (check spam)
- [ ] Resend dashboard shows delivered message ID in function logs

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run test:ranking` | Unit tests for scoring engine |
| `npm run test:ranking:live` | Live rank NEM, GOLD, AEM |
| `npm run test:polygon` | Polygon + SEC fetch smoke test |
| `npm run seed:famous-investors` | Reload `famous_investors` from JSON |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| “Submission service is not configured” (503) | `GET /api/health` → `canSubmitPortfolio: true`. If false, add Supabase vars under **Production**, then **Redeploy** (do not “Redeploy” an old deployment). Run migration `009` if using anon fallback. |
| Form saves but stays `pending` | `PROCESS_SECRET` in Vercel; Vercel logs should show `POST /api/submissions` **and** `GET /api/process-one`. If only submissions, the trigger was dropped (fixed via `after()` in `trigger-process-one.ts`). Manually re-run: `curl -H "x-process-secret: $PROCESS_SECRET" "https://goldsignal.ai/api/process-one?submissionId=UUID"` |
| Stuck `pending`/`processing` > 30 min | Daily cleanup at 06:00 UTC, or manual `process-one` curl |
| `failed` with Polygon error | `POLYGON_API_KEY`, plan limits, ticker validity |
| PDF upload error | Migration `006`, bucket `reports`, service role key |
| `PDF upload failed: Bucket not found` | Run `010_create_reports_storage_bucket.sql` in Supabase SQL Editor |
| Email not sent | Resend domain verified, `reports@goldsignal.ai`, `RESEND_API_KEY` |
| Famous investor scores always ~40 | Run `npm run seed:famous-investors` |

# SignalScore Portfolio Review — Deployment Guide

End-to-end pipeline: homepage form → Supabase → Vercel cron → rankings → PDF → Resend email.

## Environment variables (Vercel + `.env.local`)

| Variable | Where to get it | Notes |
|----------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Secret** — server only |
| `POLYGON_API_KEY` | [Polygon.io](https://polygon.io) or Massive dashboard | **Secret** — server only |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys | **Secret** |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` | Same value in Vercel; cron sends `Authorization: Bearer <value>` |
| `SEC_EDGAR_USER_AGENT` | Optional | Default: `GoldSignal.ai reports@goldsignal.ai` |
| `POLYGON_REST_BASE_URL` | Optional | Default: `https://api.polygon.io` |

## Supabase setup

1. Run migrations (SQL editor or CLI):
   - `005_portfolio_review_submissions.sql`
   - `006_reports_storage_bucket.sql`
   - `007_submission_queue_hardening.sql`
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

## Vercel

1. Add all environment variables above (Production + Preview as needed)
2. Deploy — `vercel.json` registers cron **`0 14 * * *`** (once daily at 14:00 UTC) on `/api/cron/process-submissions` (Hobby plan limit). For faster processing, trigger manually (below) or upgrade to Pro and use `*/2 * * * *`.
3. **Function timeout:** cron route uses `maxDuration: 60` (Hobby max). Use ≤3 tickers per submission or upgrade to Pro for `maxDuration: 300`.
4. **Memory:** 1024 MB recommended for PDF + multi-ticker Polygon fetches

## End-to-end test checklist

- [ ] Submit test portfolio at `https://goldsignal.ai/#portfolio-review` (or local)
- [ ] Row appears in Supabase `submissions` with `status = pending`
- [ ] Trigger processing manually (required on Hobby between daily cron runs):
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://goldsignal.ai/api/cron/process-submissions
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
| Form saves but nothing processes | `CRON_SECRET`, Vercel cron logs, submission `status` |
| `failed` with Polygon error | `POLYGON_API_KEY`, plan limits, ticker validity |
| PDF upload error | Migration `006`, bucket `reports`, service role key |
| Email not sent | Resend domain verified, `reports@goldsignal.ai`, `RESEND_API_KEY` |
| Famous investor scores always ~40 | Run `npm run seed:famous-investors` |

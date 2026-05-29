# Admin SQL queries — portfolio review pipeline

Run in **Supabase → SQL Editor** (production project).

## Inspect one submission

```sql
SELECT id, name, email, tickers, status, error_message, pdf_url,
  portfolio_score, portfolio_grade,
  processing_started_at, created_at, completed_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) AS seconds_since_submission
FROM submissions
WHERE id = 'c18d41bd-8a18-430b-989f-31a853dc4a07';
```

## Recent submissions (last hour)

```sql
SELECT id, email, status, error_message, created_at
FROM submissions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Pipeline health (last 24 hours)

```sql
SELECT
  status,
  COUNT(*) AS count,
  MAX(EXTRACT(EPOCH FROM (NOW() - created_at))) AS oldest_seconds
FROM submissions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY status;
```

## Stuck in processing (> 15 minutes)

```sql
SELECT id, email, tickers, processing_started_at, created_at
FROM submissions
WHERE status = 'processing'
  AND processing_started_at < NOW() - INTERVAL '15 minutes'
ORDER BY processing_started_at ASC;
```

## Status reference

| status | Meaning |
|--------|---------|
| `pending` | Saved; `/api/process-one` not run or not yet claimed |
| `processing` | Pipeline running (or timed out before status update) |
| `failed` | Pipeline error — read `error_message` |
| `completed` | PDF + email step finished — check Resend/spam if no inbox |

## Common `error_message` values

| error_message | Fix |
|---------------|-----|
| `PDF upload failed: Bucket not found` | Run `supabase/migrations/006_reports_storage_bucket.sql` |
| `RESEND_API_KEY is not configured` | Set `RESEND_API_KEY` in Vercel Production + redeploy |
| `Resend send failed: ...` | Verify domain `goldsignal.ai` in Resend dashboard |
| Processing timed out... | Retry with fewer tickers; Hobby limit is 60s |

# Supabase migrations (automatic on deploy)

SQL in `supabase/migrations/` is applied to **production** automatically when you push to `main`.

## How it works

1. You push to `main` (same commit that triggers Vercel).
2. GitHub Actions workflow [`.github/workflows/supabase-migrations.yml`](../.github/workflows/supabase-migrations.yml) runs `supabase db push`.
3. Only **pending** migrations run; already-applied files are skipped (tracked in `supabase_migrations.schema_migrations`).

No need to paste SQL in the Supabase SQL Editor for routine schema changes—add a new file under `supabase/migrations/` and push.

## One-time setup (GitHub secrets)

In **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|--------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) → Access Tokens → Generate |
| `SUPABASE_PROJECT_REF` | Project → **Settings → General** → **Reference ID** (same value as `SUPABASE_PROJECT_ID` in `.env.local`) |
| `SUPABASE_DB_PASSWORD` | Project → **Settings → Database** → Database password (the one you set when creating the project) |

After saving secrets, push any commit to `main` or run the workflow manually: **Actions → Supabase migrations → Run workflow**.

## Local (optional)

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:migrate
```

Uses the same migration files as CI. `.supabase/` is gitignored (link metadata stays on your machine).

## If you previously ran SQL by hand

If production already has objects from a migration file but the CLI does not list it as applied, mark it applied once (replace `023` with the version):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration repair 023 --status applied
npm run db:migrate
```

Or check status: `npm run db:migrate:status`

## Adding a new migration

1. Add `supabase/migrations/024_short_description.sql` (increment the number).
2. Commit and push to `main`.
3. Confirm the **Supabase migrations** Action succeeded in GitHub.
4. Redeploy is automatic via Vercel; new app code that depends on the schema should be in the same push when possible.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Workflow fails: missing secrets | Add the three secrets above |
| `relation already exists` | Migration was applied manually; use `migration repair` (see above) |
| Vercel build errors on new columns before migrate finishes | Re-run deploy after the Actions workflow completes (migrations usually finish before the Next build) |
| Preview deployments | This workflow only runs on `main`; preview branches do not touch production |

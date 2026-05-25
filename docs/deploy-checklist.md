# Deployment verification checklist

Use this every time you push and expect changes on **https://goldsignal.ai**.

---

## Quick checklist

- [ ] **1.** Run `git status` — working tree clean (or commit first)
- [ ] **2.** Run `bash scripts/check-deploy-status.sh` — local ↔ remote in sync
- [ ] **3.** Open [GitHub commits](https://github.com/jonbinder/gold-signal/commits/main) — latest hash matches script output
- [ ] **4.** Open [Vercel deployments](https://vercel.com/jonbinders-projects/gold-signal) — new row within ~30–60s of push
- [ ] **5.** Wait until status is **Ready** (not Building / Error)
- [ ] **6.** Confirm deployment **commit** = your `HEAD` hash (full or short)
- [ ] **7.** Open production in **incognito** (cache bypass): https://goldsignal.ai
- [ ] **8.** If custom domain looks wrong, compare **Vercel deployment URL** vs `goldsignal.ai` (see below)
- [ ] **9.** `curl https://goldsignal.ai/api/health` — `commit` / `commitShort` matches your `HEAD`
- [ ] **10.** For API changes, `POST /api/submissions` → not 404; `hasProcessSecret: true` on health

---

## Step 1 — Local Git (terminal)

Run from repo root: `C:\Users\jonjo\gold-signal`

| Command | Healthy | Problem |
|---------|---------|---------|
| `git branch --show-current` | `main` | Another branch → Production may not deploy |
| `git status` | `nothing to commit, working tree clean` | Modified/untracked files → changes not in any commit |
| `git status` (branch line) | `Your branch is up to date with 'origin/main'` | `ahead of` → not pushed; `behind` → need `git pull` |
| `git remote -v` | `origin https://github.com/jonbinder/gold-signal.git` | Wrong URL or missing `origin` |
| `git log --oneline -5` | Your latest commit at top | Missing commits you thought you made |
| `git log origin/main --oneline -5` | Same top commit as local (after `git fetch`) | Remote missing your commit |
| `git log origin/main..HEAD --oneline` | *(empty)* | Lists commits → **unpushed** |
| `git push --dry-run origin main` | `Everything up-to-date` | Would push new objects → run `git push` |

**Fix unpushed:** `git push origin main`

---

## Step 2 — GitHub (browser)

**Repo:** https://github.com/jonbinder/gold-signal

| Check | Where | Healthy | Problem |
|-------|--------|---------|---------|
| Latest commit | **Commits** on `main` | Same message + short hash as `git log -1` | Older commit on top → push failed or wrong branch |
| Default branch | **Settings → General → Default branch** | `main` | Default is not `main` → Vercel may not deploy your pushes |
| Vercel webhook | **Settings → Webhooks** | Webhook to `api.vercel.com` (or `vercel.com`), green/active | Missing, disabled, or repeated failures |
| Delivery log | Webhook → **Recent Deliveries** | Latest push → **200** response | **4xx/5xx** or no delivery on push → Vercel not notified |

**If webhook missing:** Vercel → Project → **Settings → Git** → reconnect repository.

---

## Step 3 — Vercel (dashboard)

**Project:** https://vercel.com/jonbinders-projects/gold-signal

| Check | Where | Healthy | Problem |
|-------|--------|---------|---------|
| Git connection | **Settings → Git** | Repo `jonbinder/gold-signal` | Wrong repo or disconnected |
| Production branch | **Settings → Git → Production Branch** | `main` | e.g. `master` → pushes to `main` don’t deploy |
| New deployment | **Deployments** tab | New row within ~30–60s of `git push` | No new row → webhook/build not triggered |
| Status | Deployment detail | **Ready** (green) | **Error** → open **Build Logs**; **Canceled** / stuck **Building** |
| Commit hash | Deployment → **Source** / commit message | Matches `git rev-parse --short HEAD` | Older commit → Production not updated |
| Build failed | **Building** → **Build Logs** | Build completes, no red errors | `npm run build` error, cron Hobby error, TypeScript error |
| Manual deploy | Deployment **⋯** menu | **Redeploy** or promote specific deployment | Use when Git push didn’t trigger or you need rollback |

**Statuses:**

- **Queued / Building** — wait
- **Ready** — live for that deployment’s aliases
- **Error** — fix logs, push fix, redeploy
- **Canceled** — retry deploy

---

## Step 4 — Live site

| Check | How | Healthy | Problem |
|-------|-----|---------|---------|
| Deployed commit | Vercel → Production deployment → commit SHA | = local `HEAD` | Older SHA → site not updated |
| Bypass cache | **Mac:** Cmd+Shift+R · **Windows:** Ctrl+Shift+R · or **Incognito** | See new UI | Old assets from browser cache |
| Vercel URL vs domain | Open `https://gold-signal-….vercel.app` from deployment card | Same behavior as fix | Works on `*.vercel.app` but not `goldsignal.ai` → **DNS/domain** alias issue |
| Deployed commit | `curl https://goldsignal.ai/api/health` | `commitShort` = local `git rev-parse --short HEAD` | Mismatch → Production not on your push |
| API routes | `curl -I https://goldsignal.ai/api/process-one` | **401** (not 404) | **404** → old deployment without API routes |

**Find deployment URL:** Deployments → click latest **Production** → domain list includes `goldsignal.ai` and a `gold-signal-….vercel.app` URL.

---

## Step 5 — Common failure patterns (this project)

| # | Cause | Symptom | Fix |
|---|--------|---------|-----|
| 1 | **Not pushed** | GitHub/Vercel lack your commit; `git log origin/main..HEAD` not empty | `git push origin main` |
| 2 | **Wrong branch** | Push to non-`main`; Vercel only builds Production from `main` | `git checkout main` && merge/cherry-pick && push |
| 3 | **Browser cache** | Vercel shows new commit; site looks unchanged | Incognito / hard refresh |
| 4 | **Build failed** | Vercel **Error**; no new **Ready** Production | Read build logs; fix; push again |
| 5 | **Webhook broken** | Push to GitHub, no Vercel deployment row | Reconnect Git in Vercel; check GitHub webhook deliveries |
| 6 | **Hobby cron in `vercel.json`** | Deploy **Error**: “daily cron jobs” / `*/2` schedule | Use once-daily cron only (this repo: `0 6 * * *` on `/api/cron/cleanup`) |
| 7 | **Wrong Vercel project** | Deploy succeeds but wrong site updates | Confirm project name `gold-signal` and domain aliases |
| 8 | **`.gitignore` / not in commit** | Build succeeds; feature unchanged | `git status`; ensure files were committed |
| 9 | **Server-only / API env** | UI deploys; form/API 503 or stuck `pending` | Set `PROCESS_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, etc. in Vercel **Production** + redeploy |
| 10 | **Redeploy old deployment** | Dashboard “Redeploy of …” on old commit | Deploy latest `main` commit, don’t redeploy old rows |

---

## Diagnostic script

From repo root (recommended):

```bash
npm run deploy:status
```

Or directly:

```bash
bash scripts/check-deploy-status.sh    # Git Bash / macOS / Linux
```

```powershell
.\scripts\check-deploy-status.ps1      # Windows PowerShell
```

---

## Useful links

- GitHub commits: https://github.com/jonbinder/gold-signal/commits/main
- Vercel deployments: https://vercel.com/jonbinders-projects/gold-signal
- Production site: https://goldsignal.ai
- Architecture / env: [ARCHITECTURE.md](./ARCHITECTURE.md) · [PORTFOLIO_REVIEW_DEPLOYMENT.md](./PORTFOLIO_REVIEW_DEPLOYMENT.md)

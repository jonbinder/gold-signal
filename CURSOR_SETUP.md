# GoldSignal — Cursor Setup Guide

## What's in this project

```
goldsignal/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with fonts + Navbar/Footer
│   │   ├── page.tsx             # Homepage (hero, stat bar, leaderboard preview)
│   │   ├── investors/
│   │   │   ├── page.tsx         # Investor list (card grid)
│   │   │   └── [id]/page.tsx   # Individual investor holdings table
│   │   ├── leaderboard/
│   │   │   └── page.tsx         # Most-owned miners table
│   │   └── auth/
│   │       └── page.tsx         # Auth placeholder
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── data.ts              # All data fetching helpers
│   │   └── supabase/
│   │       ├── client.ts        # Browser Supabase client
│   │       └── server.ts        # Server Supabase client
│   ├── styles/
│   │   └── globals.css          # Gold/silver dark theme + design tokens
│   └── types/
│       └── index.ts             # Full TypeScript types for all DB tables
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Full schema + seed data
```

---

## Step 1 — Open in Cursor

```bash
# Clone / copy this folder, then:
cd goldsignal
cursor .
```

---

## Step 2 — Install dependencies

```bash
npm install
```

---

## Step 3 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `goldsignal`, pick a region close to your users
3. Copy your **Project URL** and **anon key** from Settings → API

---

## Step 4 — Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_PROJECT_ID=xxxxx
```

---

## Step 5 — Run the database migration

Option A — Supabase dashboard (easiest):
1. Go to your project → SQL Editor
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run

Option B — Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase db push
```

---

## Step 6 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**The app works immediately** — all pages have seed/mock data that display
without a DB connection. Once Supabase is connected, live data takes over.

---

## Step 7 — Generate TypeScript types from your schema

```bash
npm run db:generate
```

This overwrites `src/types/supabase.ts` with fully typed definitions
auto-generated from your Supabase schema. Re-run after any schema change.

---

## Step 8 — Deploy to Vercel

```bash
npx vercel
```

Set these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin routes)

---

## Next Steps (what to build next)

### A — Add real investor data
Import 20–30 manager slugs into the `investors` table via Supabase dashboard
or write a `scripts/seed-investors.ts` script.

### B — Add real holdings data
Build a parser for SEC EDGAR 13F XML:
```
https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=13F&dateb=&owner=include&count=40
```
Map each filing row to your `holdings` table.

### C — Enable Supabase Auth
```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```
Replace the placeholder in `src/app/auth/page.tsx` with:
```tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
```

### D — Add price data
Populate `price_snapshots` table from a free API (Yahoo Finance, Finnhub, etc.)
and build sparkline charts on the leaderboard.

### E — Refresh leaderboard stats
After importing holdings, run this SQL to refresh `security_ownership_stats`:
```sql
INSERT INTO security_ownership_stats (security_id, period_id, owner_count, total_shares, total_value_usd, new_buyers, sellers)
SELECT
  security_id,
  period_id,
  COUNT(*) as owner_count,
  SUM(shares) as total_shares,
  SUM(value_usd) as total_value_usd,
  COUNT(*) FILTER (WHERE change_type = 'new') as new_buyers,
  COUNT(*) FILTER (WHERE change_type = 'sell') as sellers
FROM holdings
GROUP BY security_id, period_id
ON CONFLICT (security_id, period_id) DO UPDATE SET
  owner_count = EXCLUDED.owner_count,
  total_shares = EXCLUDED.total_shares,
  total_value_usd = EXCLUDED.total_value_usd,
  new_buyers = EXCLUDED.new_buyers,
  sellers = EXCLUDED.sellers,
  updated_at = now();
```

---

## Design System

All colors use CSS custom properties defined in `src/styles/globals.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--text-gold` | `#c9a84c` | Primary accent, ticker symbols |
| `--text-silver` | `#b0b3be` | Secondary accent |
| `--bg-obsidian` | `#0f0f11` | Page background |
| `--bg-surface` | `#161618` | Cards, tables |
| `--bg-raised` | `#1e1e22` | Elevated elements |
| `--border-dim` | `gold @ 12%` | Default borders |
| `--font-display` | Playfair Display | Headings |
| `--font-mono` | JetBrains Mono | Numbers, tickers, badges |
| `--font-body` | DM Sans | Body text |

Badge classes: `.badge-gold`, `.badge-silver`, `.badge-new`, `.badge-sell`
Table class: `.gs-table`
Utility classes: `.mono`, `.gold`, `.silver`, `.rule-gold`, `.animate-fadeUp`

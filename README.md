# GoldSignal.ai

Next.js site for precious-metals stock research and the **SignalScore** automated portfolio review.

## Portfolio review pipeline

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for module map and data flow, and **[docs/PORTFOLIO_REVIEW_DEPLOYMENT.md](docs/PORTFOLIO_REVIEW_DEPLOYMENT.md)** for production deploy, env vars, and smoke tests.

## Development

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

| Script | Purpose |
|--------|---------|
| `npm run test:ranking` | Ranking engine unit tests (40 tests) |
| `npm run test:polygon` | Polygon + SEC fetch smoke test |
| `npm run seed:famous-investors` | Load `famous_investors` table from JSON |
| `npm run deploy:status` | Check git sync + HEAD hash vs Vercel (after push) |

After every push, run `npm run deploy:status` and follow **[docs/deploy-checklist.md](docs/deploy-checklist.md)**.

## Legacy static site

The older static prototype lives in `goldsignal/` (separate from the Next.js app).

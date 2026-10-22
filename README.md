# Sea Turtle Apparel

Premium storefront for [seaturtleapparel.com](https://seaturtleapparel.com). Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

The shop renders without credentials. It does not invent products, payments, donations, certifications, or a founder biography. Demonstration rows stay hidden unless `ALLOW_DEMO_CATALOG=true` and `APP_ENV` is not `production`.

## Requirements

- Node.js 22 or newer (developed on Node 24)
- A Supabase project for data, auth, and storage
- Hostinger VPS or Node.js hosting for the server. Static hosting cannot run checkout, webhooks, or auth.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply the database before checkout or the admin desk will persist anything:

```bash
npx supabase db push
```

Or, against a local Supabase stack, run the SQL files in `supabase/migrations` in order, then `supabase/seed.sql` only in development.

Create the first owner. There is no public admin signup.

```bash
npm run create-owner
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local server |
| `npm run test` | Vitest unit tests |
| `npm run test:ui` | Browser UI tests in installed Chrome |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run start` | Run the standalone or Next production server |
| `npm run create-owner` | Grant the owner role with the service key |

## Where to read next

- [QA](docs/QA.md) — unit tests, browser tests, and what a passing run means
- [Activation](docs/ACTIVATION.md) — credentials and what stays off until they exist
- [Deployment](docs/DEPLOYMENT.md) — Hostinger, DNS, SSL, webhooks
- [Database](docs/DATABASE.md) — migrations, seed, backups, RLS
- [Payments](docs/PAYMENTS.md) — providers, test mode, webhooks
- [Security](docs/SECURITY.md) — keys, cookies, privacy requests

## Honest limits

Live card charges, delivered email, carrier rates, and statutory tax filing are not active until the matching accounts are approved and tested. Conservation payments are shown only from approved records. The planned Dhaka factory is not described as certified.

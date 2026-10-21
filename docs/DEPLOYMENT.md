# Deployment on Hostinger

This is a Next.js server application. Use a Hostinger VPS or a Node.js hosting plan that can run `next start`. Shared static hosting cannot serve checkout, auth callbacks, or payment webhooks.

Do not change production DNS, buy a plan, or rotate live keys without the owner's approval.

## Build

```bash
npm ci
npm run build
```

`npm run build` runs `next build --webpack`. Hostinger's Node hosting has glibc 2.28, so the native Next.js compiler cannot load. Webpack uses the WebAssembly fallback. Local development still uses Turbopack.

`output: "standalone"` writes `.next/standalone`. On a VPS:

```bash
node .next/standalone/server.js
```

Set `PORT=3000` and `HOSTNAME=0.0.0.0`. Keep the process up with systemd or PM2. Node.js 22 or newer.

Copy `public` and `.next/static` next to the standalone server if the host does not do that for you. Next.js documents this layout for standalone builds.

## Environment

Put the variables from `.env.example` in the host's secret store. Never commit `.env.local`.

`NEXT_PUBLIC_SITE_URL=https://seaturtleapparel.com`

The value must be a full `https://` address. A word such as `test` stops the build while page metadata is collected.

`APP_ENV=production`

`ALLOW_DEMO_CATALOG` must be unset or `false` in production. The code also refuses the demo catalog when `APP_ENV=production`.

## Domain and TLS

1. Point `seaturtleapparel.com` A/AAAA records at the VPS.
2. Point `www` at the same place, or as a CNAME to the apex.
3. Issue a certificate with the host's SSL tool or Certbot.
4. The app redirects `www` to the apex with HTTPS when the request host starts with `www.`.
5. Leave HSTS in place only after HTTPS works.

## Supabase

Keep the database on Supabase. Do not open Postgres to the public internet. The app uses the HTTPS API.

Run migrations before the first production boot. See [DATABASE.md](DATABASE.md).

Add the site URL and `https://seaturtleapparel.com/account` to Supabase Auth redirect URLs.

## Webhooks

Register the provider endpoint on the public HTTPS origin:

- `https://seaturtleapparel.com/api/webhooks/stripe`
- `https://seaturtleapparel.com/api/webhooks/paypal`
- `https://seaturtleapparel.com/api/webhooks/sslcommerz`

## Email DNS

After Resend (or the chosen provider) verifies the domain, publish the SPF, DKIM, and DMARC records they supply. Do not invent those values.

## Health and maintenance

`GET /api/health` returns `{ ok: true }` without secrets.

Set `MAINTENANCE_MODE=true` to rewrite public pages to `/maintenance`. Admin and the health check stay available.

`POST /api/cron/reservations` with `Authorization: Bearer $CRON_SECRET` releases expired stock reservations. Schedule it every few minutes.

## Rollback

Keep the previous standalone build. If a release fails health, stop the new process and start the previous one. Database migrations are forward-only; restore a Supabase backup if a migration must be undone.

## Logs

The Node process logs configuration gaps at startup when instrumentation runs. Do not log passwords, tokens, or card data. Provider dashboards hold payment details.

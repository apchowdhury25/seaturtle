# QA guide

Two suites cover this store. `npm test` is the fast unit suite. `npm run test:ui` is the browser suite. Run both before a production deploy.

Use `http://localhost:3000`. Do not point the browser suite at `127.0.0.1`. This machine's Chrome does not treat a `--window-size=390` flag as 390 CSS pixels, so the phone project sets the viewport itself.

## Unit suite

```bash
npm test
```

Vitest covers prices, lookbook filtering, payment signature checks, row-level security SQL, and the Supabase environment names. It does not open a browser and it does not need the dev server.

## UI suite

```bash
npm run test:ui
```

Playwright drives the Chrome already installed on the machine. It does not download a second browser. If port 3000 is already serving this app, that server is reused. Otherwise the command starts `npm run dev` and stops it when the run finishes.

Override the target with `PLAYWRIGHT_BASE_URL` only for a full server you control, such as a staging deploy. Do not run this suite against production checkout.

The suite has three projects:

| Project | Width | What it checks |
| --- | --- | --- |
| smoke | none | Every public page returns a successful response. Health, sitemap, robots, a missing URL, and an unknown product. |
| desktop | 1280×900 | Home, swimming clip, search, a lookbook product, cart, checkout, sign-in, cookies, and horizontal overflow. |
| mobile | 390×844 | The menu, the swimming clip frame, and the same overflow pages. |

Public pages are discovered from `src/app`. A new `page.tsx` is included on the next run. Dynamic segments such as `/products/[slug]` are not crawled. The smoke list adds `/products/reef-pima-crew` and `/collections/reef` as the sample records.

Phone and desktop layout checks visit `/`, `/shop`, `/men`, `/women`, `/products/reef-pima-crew`, `/cart`, `/account/login`, and `/conservation`. An element fails when it paints outside the viewport and it is not inside a horizontal scroller. Fixed bars, including the cookie notice, are ignored. The cookie notice is dismissed with the `sta_cookie` localStorage value `rejected` except in the test that clicks Reject optional.

## What a passing run means

Without Supabase keys, the shop shows the house lookbook. That is expected.

- The cart says it is unavailable until the server database key is configured.
- A lookbook product says it cannot be added to a bag. There is no add-to-bag button.
- Sign-in with any address returns "Sign-in needs Supabase Auth." The suite uses `qa@example.com` and a fake password. It never uses a real account.
- `/does-not-exist` is HTTP 404.
- `/products/not-a-real-style` renders "This page is not on the map." The status may be 200 because the shop shell can stream before the not-found result. The heading is the check.
- `/api/health` returns `ok: true` and does not include a key.

With a database connected, the cart and sign-in copy change. Update those two assertions before treating a database-backed environment as the default target.

## What this suite does not do

It does not place an order, call a payment provider, submit the contact form, or sign in as the owner. Those need credentials and would write data. Webhook signatures stay in `npm test`.

Admin pages are only checked for a successful response. Staff actions are not clicked.

## When a test fails

The line reporter names the project, the test, and the route. A smoke failure lists every broken URL in one message. An overflow failure names the route and the top element that sticks out.

Traces are saved on retry. Locally there is no retry, so rerun one file while the dev server is up:

```bash
npx playwright test e2e/mobile.spec.ts --project=mobile
```

Screenshots and traces land in `test-results/` and `playwright-report/`. Both directories are gitignored.

## Before a Hostinger deploy

1. `npm test`
2. `npm run test:ui` against the local server
3. After Hostinger finishes the build, open `https://seaturtleapparel.com/api/health` and the homepage. Health should stay `ok: true`. `supabase` becomes true only after the panel has stored `SUPABASE_URL` and `SUPABASE_ANON_KEY` and the deployed commit reads those names. Checkout still needs the service-role key.

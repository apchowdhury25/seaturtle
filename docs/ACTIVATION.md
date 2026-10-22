# Activation

Features below are implemented. They stay inactive until the listed credential exists. The application does not simulate a successful live payment.

## Required for a working shop

| Service | Variables | What it unlocks |
| --- | --- | --- |
| Supabase URL and publishable/anon key | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Hostinger's wizard sets `SUPABASE_URL` and `SUPABASE_ANON_KEY`. `SUPABASE_API_KEY` is the same public key. | Public catalog reads and customer sign-in |
| Supabase server secret | `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Guest carts, checkout, webhooks, private uploads, owner bootstrap |
| Site URL | `NEXT_PUBLIC_SITE_URL` | Canonical links, payment return URLs, email links |

## Payments

Set `PAYMENT_MODE=test` until a provider webhook has been verified.

| Provider | Variables | Webhook |
| --- | --- | --- |
| Sandbox | `PAYMENT_TEST_WEBHOOK_SECRET` | Signed inside `/checkout/test/[orderId]`. Not a card charge. |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key | `POST /api/webhooks/stripe` |
| SSLCommerz | `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | `POST /api/webhooks/sslcommerz` validates with the provider API |
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | `POST /api/webhooks/paypal` |

`PAYMENT_MODE=live` does not mark an order paid by itself. A signed webhook must match the order total and currency.

A browser return to `/orders/return` is not payment confirmation.

## Email

`RESEND_API_KEY` and `EMAIL_FROM`. Verify the seaturtleapparel.com domain and publish SPF, DKIM, and DMARC in DNS before sending. Until then, sends are stored as skipped in `notification_logs`.

## Owner

`OWNER_EMAIL` and `OWNER_PASSWORD`, then `npm run create-owner`. Grant other roles from `/admin/staff`. Do not ship a shared password.

## Not connected

Tax filing services, carrier rating APIs, and exchange-rate feeds are not called. Shipping, tax, and prices are administrator-configured. Currency conversion is not invented.

## Still operator work

- Publish real products only after removing demonstration flags.
- Enter supplier evidence before calling a supplier vetted.
- Record conservation payments with evidence before making them public.
- Have counsel review the policy drafts for Bangladesh and every destination country.
- Publish a contact email, phone, and address only when they are real.

# Payments

The order total is calculated in Postgres during `checkout_create_order`. The browser preview is not the amount that gets charged.

Providers:

- Stripe Checkout Session for the server total, in minor units.
- SSLCommerz hosted page. The amount is converted with the currency exponent, not a hardcoded division by 100. The return URL does not mark the order paid. The IPN is validated with SSLCommerz before a status change.
- PayPal order with `CAPTURE` intent. Paid status comes from `PAYMENT.CAPTURE.COMPLETED`, not from the approval redirect.
- Test checkout when `PAYMENT_MODE=test` and `PAYMENT_TEST_WEBHOOK_SECRET` are set. It signs a payload and calls the same payment function. It does not charge a card.

## Rules

- Card numbers and CVVs are never stored.
- Secrets stay in server environment variables.
- Webhook signatures are verified before the database changes.
- `payment_events` is unique on provider and event id, so retries do not double-apply.
- The event amount and currency must match the order. A mismatch is rejected before the event row is consumed.
- A failed payment cannot later become paid.
- Refunds in the admin desk require a provider reference and an explicit confirmation that the provider already refunded. The desk records that fact. It does not pretend to move money by itself.

## Go live

1. Complete merchant approval for the provider that can actually pay out to the business.
2. Register the webhook on the production HTTPS URL.
3. Run a sandbox payment and a duplicate delivery. Confirm one paid order and one duplicate response.
4. Only then set `PAYMENT_MODE=live` with the live keys.

Until that checklist is done, the store is not described as able to take live payment.

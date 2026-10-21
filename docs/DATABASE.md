# Database

Supabase hosts Postgres, Auth, and Storage. SQL lives in `supabase/migrations` and is applied in filename order.

1. `202610200001_schema.sql` — tables, constraints, indexes
2. `202610200002_functions.sql` — checkout and payment functions, granted to `service_role` only
3. `202610200003_rls.sql` — row level security on every public table, plus storage buckets

## Development seed

`supabase/seed.sql` is development-only. It inserts demonstration categories, products, a shipping method, a discount, a pending supplier, a planned Dhaka facility, and an inactive conservation program. It does not insert orders, payments, or donations.

Do not run the seed against production.

```bash
npx supabase db push
# development database only:
psql "$DATABASE_URL" -f supabase/seed.sql
```

Production initialization is the three migrations, storage buckets created by the third migration, and `npm run create-owner`. Then create real catalog rows in the admin desk.

## Money and orders

Amounts are integers in minor units. Order rows copy the product name, SKU, unit price, and totals at purchase time. Later catalog edits do not rewrite history.

Checkout and payment updates run inside `checkout_create_order` and `apply_payment_event`. Stock reservations use `FOR UPDATE`. A variant cannot reserve more than `on_hand`.

## Row level security

Customers read their own profile, addresses, carts, wishlists, and orders. They cannot update totals, payment status, or roles.

Anonymous reads are limited to active, non-demonstration products and published public content. Published trace records hide demonstration rows. Supplier documents are not publicly readable.

Staff writes require `app_has_permission`. Read permission does not grant delete.

The service role bypasses RLS and is used for guest carts, webhooks, the owner script, and private file upload after an application permission check.

## Storage

Public buckets: `product-images`, `collection-images`, `brand-assets`.

Private buckets: `supplier-documents`, `certifications`, `support-attachments`.

JPEG, PNG, and WebP product images are limited to 8 MB. Private documents allow PDF, JPEG, and PNG up to 20 MB.

## Backup

Use Supabase scheduled backups and point-in-time recovery on the paid plan you choose. Export a logical backup before a risky migration. Test a restore into a separate project before relying on it.

## Privacy

Deletion and access requests are rows in `privacy_requests`. Staff complete them; the request itself is not deletion.

-- Sea Turtle Apparel schema. Monetary amounts are integers in minor units.
-- Demonstration rows must stay flagged and are excluded from public policies.

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.round_half_up_div(numerator bigint, denominator bigint)
returns bigint
language sql
immutable
as $$
  select case
    when denominator = 0 then 0
    when numerator >= 0 then (numerator + (denominator / 2)) / denominator
    else - (((-numerator) + (denominator / 2)) / denominator)
  end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext,
  full_name text not null default '',
  phone text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in (
    'owner', 'administrator', 'operations_manager', 'inventory_manager',
    'customer_support', 'sustainability_manager', 'marketing_manager', 'auditor'
  )),
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.role_permissions (
  role text not null,
  permission text not null,
  primary key (role, permission)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Address',
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country_code char(2) not null,
  phone text,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  kind text not null default 'manual' check (kind in ('manual', 'featured', 'new', 'best_sellers', 'seasonal')),
  image_path text,
  is_public boolean not null default true,
  is_demonstration boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  description text not null default '',
  short_description text not null default '',
  category_id uuid references public.categories (id),
  gender text check (gender in ('men', 'women', 'unisex')),
  product_type text,
  brand text not null default 'Sea Turtle Apparel',
  currency char(3) not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_demonstration boolean not null default false,
  is_featured boolean not null default false,
  material_composition text,
  fabric_weight text,
  fabric_origin text,
  manufacturing_country text,
  manufacturing_facility text,
  fit text,
  care_instructions text,
  sustainability_summary text,
  shipping_weight_grams integer check (shipping_weight_grams is null or shipping_weight_grams >= 0),
  package_length_mm integer,
  package_width_mm integer,
  package_height_mm integer,
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  tax_category text not null default 'apparel',
  related_product_ids uuid[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(short_description, '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C')
    || setweight(to_tsvector('english', coalesce(sku, '')), 'A')
  ) stored
);

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  barcode text unique,
  color_name text not null default '',
  color_hex text,
  size_label text not null default '',
  size_system text not null default 'alpha',
  regular_price_minor bigint not null check (regular_price_minor >= 0),
  sale_price_minor bigint check (sale_price_minor is null or sale_price_minor >= 0),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  currency char(3) not null,
  weight_grams integer not null default 0 check (weight_grams >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  measurements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  check (reserved <= on_hand)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id),
  quantity_delta integer not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id),
  order_id uuid,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  released_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  token_hash text unique,
  currency char(3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  quantity integer not null check (quantity > 0 and quantity <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  type text not null check (type in ('percentage', 'fixed_amount', 'free_shipping')),
  percentage_bps integer check (percentage_bps is null or (percentage_bps > 0 and percentage_bps <= 10000)),
  amount_minor bigint check (amount_minor is null or amount_minor > 0),
  currency char(3),
  min_subtotal_minor bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  per_customer_limit integer,
  product_ids uuid[],
  category_ids uuid[],
  first_order_only boolean not null default false,
  is_active boolean not null default false,
  is_demonstration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts (id),
  order_id uuid,
  user_id uuid references public.profiles (id),
  email citext,
  amount_minor bigint not null default 0,
  created_at timestamptz not null default now()
);

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  countries text[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references public.shipping_zones (id),
  name text not null,
  countries text[] not null default '{}',
  currency char(3) not null,
  flat_minor bigint not null default 0 check (flat_minor >= 0),
  free_threshold_minor bigint,
  min_weight_grams integer,
  max_weight_grams integer,
  per_kg_minor bigint not null default 0 check (per_kg_minor >= 0),
  estimate_min_days integer,
  estimate_max_days integer,
  is_active boolean not null default false,
  is_demonstration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  region_code text,
  product_tax_category text,
  rate_bps integer not null check (rate_bps >= 0 and rate_bps <= 10000),
  inclusive boolean not null default false,
  applies_to_shipping boolean not null default false,
  priority integer not null default 0,
  is_active boolean not null default false,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles (id),
  email citext not null,
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'payment_failed', 'cancelled', 'partially_fulfilled',
    'fulfilled', 'partially_refunded', 'refunded'
  )),
  currency char(3) not null,
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  tax_inclusive boolean not null default false,
  discount_code text,
  shipping_method_name text,
  shipping_estimate text,
  tracking_token_hash text not null unique,
  idempotency_key text unique,
  customer_note text,
  is_demonstration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  sku text not null,
  color_name text,
  size_label text,
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  currency char(3) not null,
  tax_category text
);

create table public.order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('shipping', 'billing')),
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country_code char(2) not null,
  phone text,
  unique (order_id, kind)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null,
  status text not null check (status in (
    'pending', 'processing', 'authorized', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded'
  )),
  environment text not null check (environment in ('test', 'live')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  order_id uuid references public.orders (id),
  sanitized jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments (id),
  order_id uuid not null references public.orders (id),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  reason text,
  restock boolean not null default false,
  provider_reference text unique,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'shipped', 'delivered', 'cancelled')),
  carrier text,
  tracking_number text,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id),
  quantity integer not null check (quantity > 0)
);

alter table public.inventory_reservations
  add constraint inventory_reservations_order_fk
  foreign key (order_id) references public.orders (id);

alter table public.discount_redemptions
  add constraint discount_redemptions_order_fk
  foreign key (order_id) references public.orders (id);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references public.profiles (id),
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'pending' check (status in ('pending', 'subscribed', 'unsubscribed')),
  consent_at timestamptz,
  token_hash text unique,
  verified_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  subject text not null,
  message text not null,
  order_reference text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid references public.contact_requests (id),
  requester_email citext not null,
  requester_name text,
  user_id uuid references public.profiles (id),
  subject text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  assigned_to uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid references public.profiles (id),
  body text not null,
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  public_name text not null,
  legal_name text,
  country_code char(2),
  status text not null default 'pending' check (status in (
    'pending', 'under_review', 'approved', 'conditional', 'suspended', 'rejected'
  )),
  disclosure_authorized boolean not null default false,
  is_public boolean not null default false,
  is_demonstration boolean not null default false,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_title text,
  created_at timestamptz not null default now()
);

create table public.supplier_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  title text not null,
  storage_path text not null,
  document_date date,
  visibility text not null default 'private' check (visibility in ('private', 'staff')),
  created_at timestamptz not null default now()
);

create table public.manufacturing_facilities (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id),
  name text not null,
  country_code char(2),
  city text,
  status text not null default 'planned' check (status in ('planned', 'under_review', 'operating', 'suspended')),
  is_public boolean not null default false,
  is_demonstration boolean not null default false,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('supplier', 'facility', 'product', 'material')),
  owner_id uuid not null,
  name text not null,
  issuer text,
  valid_from date,
  valid_until date,
  status text not null default 'unverified' check (status in ('unverified', 'verified', 'expired', 'revoked')),
  evidence_path text,
  is_public boolean not null default false,
  is_demonstration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_audits (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  facility_id uuid references public.manufacturing_facilities (id),
  audit_date date,
  status text not null default 'pending' check (status in (
    'pending', 'under_review', 'approved', 'conditional', 'suspended', 'rejected'
  )),
  summary text not null default '',
  evidence_path text,
  reviewer_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  composition text,
  origin_public text,
  evidence_level text not null default 'unavailable' check (evidence_level in (
    'verified_third_party', 'supplier_reported', 'internal_measurement', 'estimated', 'planned', 'unavailable'
  )),
  is_demonstration boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.material_batches (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.raw_materials (id),
  supplier_id uuid references public.suppliers (id),
  facility_id uuid references public.manufacturing_facilities (id),
  lot_code text not null,
  evidence_level text not null default 'unavailable',
  is_demonstration boolean not null default false,
  received_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.production_batches (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.manufacturing_facilities (id),
  batch_code text not null unique,
  started_on date,
  completed_on date,
  evidence_level text not null default 'unavailable',
  is_demonstration boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table public.product_batch_links (
  product_id uuid not null references public.products (id) on delete cascade,
  production_batch_id uuid not null references public.production_batches (id) on delete cascade,
  primary key (product_id, production_batch_id)
);

create table public.product_traceability_records (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  production_batch_id uuid references public.production_batches (id),
  public_token text not null unique,
  is_published boolean not null default false,
  is_demonstration boolean not null default false,
  public_summary text not null default '',
  stages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.environmental_measurements (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.manufacturing_facilities (id),
  metric text not null,
  value_numeric numeric,
  unit text,
  period_start date,
  period_end date,
  evidence_level text not null default 'unavailable',
  note text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.corrective_actions (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id),
  facility_id uuid references public.manufacturing_facilities (id),
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  due_on date,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conservation_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  summary text not null default '',
  partnership_status text not null default 'prospective' check (partnership_status in ('prospective', 'in_discussion', 'active', 'ended')),
  is_public boolean not null default false,
  is_demonstration boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conservation_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.conservation_organizations (id),
  name text not null,
  model text not null check (model in ('percent_revenue', 'percent_profit', 'fixed_per_item', 'manual')),
  rate_bps integer,
  fixed_minor bigint,
  currency char(3) not null default 'USD',
  category_ids uuid[],
  eligible_statuses text[] not null default array['paid']::text[],
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  is_public boolean not null default false,
  is_demonstration boolean not null default false,
  public_explanation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conservation_accruals (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.conservation_programs (id),
  order_id uuid references public.orders (id),
  amount_minor bigint not null default 0,
  currency char(3) not null,
  basis_minor bigint,
  status text not null check (status in ('calculated', 'blocked', 'manual', 'approved', 'void')),
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (program_id, order_id)
);

create table public.conservation_payments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.conservation_programs (id),
  organization_id uuid references public.conservation_organizations (id),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null,
  paid_on date not null,
  evidence_path text,
  approval_status text not null default 'recorded' check (approval_status in ('recorded', 'approved', 'rejected')),
  is_public boolean not null default false,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  href text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'home',
  title text not null,
  body text not null default '',
  href text,
  image_path text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.editorial_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  author_name text,
  category text,
  image_path text,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_path text not null,
  permanent boolean not null default true,
  is_active boolean not null default true
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  recipient_hash text,
  status text not null check (status in ('queued', 'sent', 'skipped', 'failed')),
  provider text,
  error text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  product_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  email citext not null,
  request_type text not null check (request_type in ('access', 'correction', 'deletion', 'export')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'rejected')),
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.size_charts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_slug text,
  rows jsonb not null default '[]'::jsonb,
  note text not null default '',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index products_search_idx on public.products using gin (search_vector);
create index products_category_idx on public.products (category_id, status);
create index products_status_idx on public.products (status, published_at desc);
create index variants_product_idx on public.product_variants (product_id);
create index orders_email_idx on public.orders (email);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index payments_order_idx on public.payments (order_id);
create index analytics_event_idx on public.analytics_events (event_name, created_at desc);
create index reservations_expiry_idx on public.inventory_reservations (expires_at) where released_at is null and consumed_at is null;
create index tickets_status_idx on public.support_tickets (status, created_at desc);

insert into public.role_permissions (role, permission)
values
  ('owner', 'catalog.read'), ('owner', 'catalog.write'), ('owner', 'orders.read'), ('owner', 'orders.write'),
  ('owner', 'orders.refund'), ('owner', 'customers.read'), ('owner', 'customers.write'), ('owner', 'discounts.write'),
  ('owner', 'shipping.write'), ('owner', 'content.write'), ('owner', 'support.read'), ('owner', 'support.write'),
  ('owner', 'sustainability.read'), ('owner', 'sustainability.write'), ('owner', 'conservation.read'),
  ('owner', 'conservation.write'), ('owner', 'staff.manage'), ('owner', 'audit.read'), ('owner', 'settings.write'),
  ('owner', 'analytics.read'),
  ('administrator', 'catalog.read'), ('administrator', 'catalog.write'), ('administrator', 'orders.read'),
  ('administrator', 'orders.write'), ('administrator', 'orders.refund'), ('administrator', 'customers.read'),
  ('administrator', 'customers.write'), ('administrator', 'discounts.write'), ('administrator', 'shipping.write'),
  ('administrator', 'content.write'), ('administrator', 'support.read'), ('administrator', 'support.write'),
  ('administrator', 'sustainability.read'), ('administrator', 'sustainability.write'),
  ('administrator', 'conservation.read'), ('administrator', 'conservation.write'), ('administrator', 'audit.read'),
  ('administrator', 'settings.write'), ('administrator', 'analytics.read'),
  ('operations_manager', 'orders.read'), ('operations_manager', 'orders.write'), ('operations_manager', 'orders.refund'),
  ('operations_manager', 'customers.read'), ('operations_manager', 'shipping.write'), ('operations_manager', 'support.read'),
  ('operations_manager', 'support.write'), ('operations_manager', 'analytics.read'), ('operations_manager', 'catalog.read'),
  ('inventory_manager', 'catalog.read'), ('inventory_manager', 'catalog.write'), ('inventory_manager', 'orders.read'),
  ('inventory_manager', 'analytics.read'),
  ('customer_support', 'orders.read'), ('customer_support', 'orders.write'), ('customer_support', 'customers.read'),
  ('customer_support', 'customers.write'), ('customer_support', 'support.read'), ('customer_support', 'support.write'),
  ('sustainability_manager', 'catalog.read'), ('sustainability_manager', 'sustainability.read'),
  ('sustainability_manager', 'sustainability.write'), ('sustainability_manager', 'conservation.read'),
  ('sustainability_manager', 'conservation.write'),
  ('marketing_manager', 'catalog.read'), ('marketing_manager', 'content.write'), ('marketing_manager', 'discounts.write'),
  ('marketing_manager', 'analytics.read'), ('marketing_manager', 'customers.read'),
  ('auditor', 'catalog.read'), ('auditor', 'orders.read'), ('auditor', 'customers.read'), ('auditor', 'support.read'),
  ('auditor', 'sustainability.read'), ('auditor', 'conservation.read'), ('auditor', 'audit.read'), ('auditor', 'analytics.read');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'customer_addresses', 'categories', 'collections', 'products', 'product_variants',
    'inventory', 'carts', 'cart_items', 'discounts', 'shipping_zones', 'shipping_methods', 'tax_rules',
    'orders', 'payments', 'shipments', 'support_tickets', 'suppliers', 'manufacturing_facilities',
    'certifications', 'product_traceability_records', 'corrective_actions', 'conservation_organizations',
    'conservation_programs', 'content_pages', 'editorial_articles', 'privacy_requests', 'size_charts'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

-- Authoritative checkout, reservation release, and idempotent payment updates.
-- Formulas mirror src/lib/commerce.ts: half-up integer division, minor units only.

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer := 0;
  reservation record;
begin
  for reservation in
    select * from public.inventory_reservations
    where released_at is null and consumed_at is null and expires_at <= now()
    for update
  loop
    update public.inventory
      set reserved = greatest(reserved - reservation.quantity, 0)
      where variant_id = reservation.variant_id;
    update public.inventory_reservations
      set released_at = now()
      where id = reservation.id;
    insert into public.inventory_movements (variant_id, quantity_delta, reason, reference_type, reference_id, note)
    values (reservation.variant_id, 0, 'reservation_expired', 'reservation', reservation.id, 'Released expired checkout reservation.');
    released_count := released_count + 1;
  end loop;
  return released_count;
end;
$$;

create or replace function public.checkout_create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cart_row public.carts%rowtype;
  existing public.orders%rowtype;
  method public.shipping_methods%rowtype;
  discount public.discounts%rowtype;
  item record;
  address jsonb;
  billing jsonb;
  order_id uuid := gen_random_uuid();
  order_no text := 'STA-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 10));
  raw_token text := encode(gen_random_bytes(32), 'hex');
  currency_code char(3);
  subtotal bigint := 0;
  eligible bigint := 0;
  discount_minor bigint := 0;
  free_shipping boolean := false;
  shipping_minor bigint := 0;
  tax_minor bigint := 0;
  weight_grams integer := 0;
  minutes integer := 30;
  reservation_until timestamptz;
  prior_orders integer := 0;
  line_price bigint;
  line_total bigint;
  taxable bigint;
  rule record;
  share bigint;
  allocated bigint := 0;
  line_count integer := 0;
  line_index integer := 0;
  prices_include_tax boolean := false;
  saw_tax boolean := false;
  allow_demo boolean := coalesce((payload ->> 'allow_demonstration')::boolean, false);
  customer_user uuid := nullif(payload ->> 'user_id', '')::uuid;
begin
  if payload ->> 'idempotency_key' is not null and payload ->> 'idempotency_key' <> '' then
    select * into existing from public.orders where idempotency_key = payload ->> 'idempotency_key';
    if found then
      return jsonb_build_object(
        'ok', true,
        'replayed', true,
        'order_id', existing.id,
        'order_number', existing.order_number,
        'total_minor', existing.total_minor,
        'currency', existing.currency,
        'status', existing.status
      );
    end if;
  end if;

  perform public.release_expired_reservations();

  select * into cart_row from public.carts where id = (payload ->> 'cart_id')::uuid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'cart_not_found');
  end if;
  if cart_row.token_hash is distinct from encode(digest(payload ->> 'cart_token', 'sha256'), 'hex') then
    return jsonb_build_object('ok', false, 'error', 'cart_unauthorized');
  end if;
  if cart_row.user_id is not null and cart_row.user_id is distinct from customer_user then
    return jsonb_build_object('ok', false, 'error', 'cart_unauthorized');
  end if;
  if coalesce(payload ->> 'email', '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  address := payload -> 'shipping_address';
  if address is null
    or coalesce(address ->> 'full_name', '') = ''
    or coalesce(address ->> 'line1', '') = ''
    or coalesce(address ->> 'city', '') = ''
    or coalesce(address ->> 'postal_code', '') = ''
    or coalesce(address ->> 'country_code', '') !~ '^[A-Za-z]{2}$'
  then
    return jsonb_build_object('ok', false, 'error', 'invalid_address');
  end if;
  billing := coalesce(payload -> 'billing_address', address);

  select * into method from public.shipping_methods where id = (payload ->> 'shipping_method_id')::uuid;
  if not found or method.is_active = false then
    return jsonb_build_object('ok', false, 'error', 'invalid_shipping');
  end if;
  if method.is_demonstration and not allow_demo then
    return jsonb_build_object('ok', false, 'error', 'invalid_shipping');
  end if;
  if not ('*' = any (method.countries) or upper(address ->> 'country_code') = any (select upper(c) from unnest(method.countries) c)) then
    return jsonb_build_object('ok', false, 'error', 'destination_not_served');
  end if;

  create temporary table tmp_lines (
    variant_id uuid,
    product_id uuid,
    category_id uuid,
    product_name text,
    sku text,
    color_name text,
    size_label text,
    quantity integer,
    unit_price bigint,
    line_total bigint,
    currency char(3),
    tax_category text,
    weight_grams integer,
    is_demonstration boolean
  ) on commit drop;

  for item in
    select ci.quantity, v.*, p.name as product_name, p.category_id, p.tax_category, p.is_demonstration, p.status as product_status
    from public.cart_items ci
    join public.product_variants v on v.id = ci.variant_id
    join public.products p on p.id = v.product_id
    where ci.cart_id = cart_row.id
    for update of v
  loop
    if item.product_status <> 'active' or item.status <> 'active' then
      return jsonb_build_object('ok', false, 'error', 'unavailable_item');
    end if;
    if item.is_demonstration and not allow_demo then
      return jsonb_build_object('ok', false, 'error', 'unavailable_item');
    end if;
    if item.quantity < 1 or item.quantity > 20 then
      return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
    end if;

    line_price := item.regular_price_minor;
    if item.sale_price_minor is not null
      and item.sale_price_minor < item.regular_price_minor
      and (item.sale_starts_at is null or item.sale_starts_at <= now())
      and (item.sale_ends_at is null or item.sale_ends_at > now())
    then
      line_price := item.sale_price_minor;
    end if;
    line_total := line_price * item.quantity;
    if currency_code is null then
      currency_code := item.currency;
    elsif currency_code <> item.currency then
      return jsonb_build_object('ok', false, 'error', 'mixed_currency');
    end if;

    insert into tmp_lines values (
      item.id, item.product_id, item.category_id, item.product_name, item.sku, item.color_name, item.size_label,
      item.quantity, line_price, line_total, item.currency, item.tax_category, item.weight_grams, item.is_demonstration
    );
    subtotal := subtotal + line_total;
    weight_grams := weight_grams + (item.weight_grams * item.quantity);
    line_count := line_count + 1;
  end loop;

  if line_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty_cart');
  end if;
  if method.currency <> currency_code then
    return jsonb_build_object('ok', false, 'error', 'currency_mismatch');
  end if;

  if coalesce(payload ->> 'discount_code', '') <> '' then
    select * into discount from public.discounts where lower(code) = lower(payload ->> 'discount_code') for update;
    if not found or discount.is_active = false or (discount.is_demonstration and not allow_demo) then
      return jsonb_build_object('ok', false, 'error', 'invalid_discount');
    end if;
    if (discount.starts_at is not null and discount.starts_at > now()) or (discount.ends_at is not null and discount.ends_at < now()) then
      return jsonb_build_object('ok', false, 'error', 'invalid_discount');
    end if;
    if discount.usage_limit is not null and discount.usage_count >= discount.usage_limit then
      return jsonb_build_object('ok', false, 'error', 'invalid_discount');
    end if;
    if discount.per_customer_limit is not null then
      if (
        select count(*) from public.discount_redemptions
        where discount_id = discount.id and email = (payload ->> 'email')
      ) >= discount.per_customer_limit then
        return jsonb_build_object('ok', false, 'error', 'invalid_discount');
      end if;
    end if;
    select count(*) into prior_orders from public.orders
      where email = (payload ->> 'email') and status not in ('cancelled', 'payment_failed');
    if discount.first_order_only and prior_orders > 0 then
      return jsonb_build_object('ok', false, 'error', 'invalid_discount');
    end if;
    if discount.min_subtotal_minor is not null and subtotal < discount.min_subtotal_minor then
      return jsonb_build_object('ok', false, 'error', 'invalid_discount');
    end if;

    select coalesce(sum(line_total), 0) into eligible from tmp_lines
    where (
      (discount.product_ids is null or cardinality(discount.product_ids) = 0 or product_id = any (discount.product_ids))
      and (discount.category_ids is null or cardinality(discount.category_ids) = 0 or category_id = any (discount.category_ids))
    );
    if discount.product_ids is not null and cardinality(discount.product_ids) > 0
      and discount.category_ids is not null and cardinality(discount.category_ids) > 0 then
      select coalesce(sum(line_total), 0) into eligible from tmp_lines
      where product_id = any (discount.product_ids) or category_id = any (discount.category_ids);
    end if;
    if eligible <= 0 then
      return jsonb_build_object('ok', false, 'error', 'invalid_discount');
    end if;

    if discount.type = 'free_shipping' then
      free_shipping := true;
    elsif discount.type = 'percentage' then
      discount_minor := least(eligible, public.round_half_up_div(eligible * discount.percentage_bps, 10000));
    else
      if discount.currency is distinct from currency_code then
        return jsonb_build_object('ok', false, 'error', 'invalid_discount');
      end if;
      discount_minor := least(discount.amount_minor, eligible);
    end if;
  end if;

  if method.min_weight_grams is not null and weight_grams < method.min_weight_grams then
    return jsonb_build_object('ok', false, 'error', 'invalid_shipping');
  end if;
  if method.max_weight_grams is not null and weight_grams > method.max_weight_grams then
    return jsonb_build_object('ok', false, 'error', 'invalid_shipping');
  end if;
  if method.free_threshold_minor is not null and (subtotal - discount_minor) >= method.free_threshold_minor then
    shipping_minor := 0;
  else
    shipping_minor := method.flat_minor + public.round_half_up_div(method.per_kg_minor * weight_grams, 1000);
  end if;
  if free_shipping then
    shipping_minor := 0;
  end if;

  for item in select * from tmp_lines loop
    line_index := line_index + 1;
    if discount_minor > 0 and eligible > 0 then
      if line_index = line_count then
        share := discount_minor - allocated;
      else
        share := public.round_half_up_div(discount_minor * item.line_total, eligible);
        allocated := allocated + share;
      end if;
    else
      share := 0;
    end if;
    taxable := greatest(item.line_total - share, 0);
    select * into rule from public.tax_rules
    where is_active
      and country_code = upper(address ->> 'country_code')
      and (region_code is null or region_code = coalesce(address ->> 'region', ''))
      and (product_tax_category is null or product_tax_category = item.tax_category)
    order by (product_tax_category is not null) desc, (region_code is not null) desc, priority desc
    limit 1;
    if found then
      if saw_tax and prices_include_tax is distinct from rule.inclusive then
        return jsonb_build_object('ok', false, 'error', 'mixed_tax');
      end if;
      saw_tax := true;
      prices_include_tax := rule.inclusive;
      if rule.inclusive then
        tax_minor := tax_minor + public.round_half_up_div(taxable * rule.rate_bps, 10000 + rule.rate_bps);
      else
        tax_minor := tax_minor + public.round_half_up_div(taxable * rule.rate_bps, 10000);
      end if;
    end if;
  end loop;

  if shipping_minor > 0 then
    select * into rule from public.tax_rules
    where is_active and applies_to_shipping and not inclusive
      and country_code = upper(address ->> 'country_code')
      and (region_code is null or region_code = coalesce(address ->> 'region', ''))
    order by priority desc
    limit 1;
    if found then
      tax_minor := tax_minor + public.round_half_up_div(shipping_minor * rule.rate_bps, 10000);
    end if;
  end if;

  select coalesce((value ->> 'reservation_minutes')::integer, 30) into minutes
  from public.site_settings where key = 'commerce';
  if minutes is null or minutes < 5 then
    minutes := 30;
  end if;
  reservation_until := now() + make_interval(mins => minutes);

  insert into public.orders (
    id, order_number, user_id, email, status, currency, subtotal_minor, discount_minor, shipping_minor,
    tax_minor, total_minor, tax_inclusive, discount_code, shipping_method_name, shipping_estimate, tracking_token_hash,
    idempotency_key, customer_note, is_demonstration
  ) values (
    order_id, order_no, customer_user, payload ->> 'email', 'pending_payment', currency_code, subtotal,
    discount_minor, shipping_minor, tax_minor,
    (subtotal - discount_minor) + shipping_minor + case when prices_include_tax then 0 else tax_minor end,
    prices_include_tax,
    nullif(payload ->> 'discount_code', ''),
    method.name,
    case when method.estimate_min_days is null then null else method.estimate_min_days || '–' || coalesce(method.estimate_max_days, method.estimate_min_days) || ' days when shipped' end,
    encode(digest(raw_token, 'sha256'), 'hex'),
    nullif(payload ->> 'idempotency_key', ''),
    nullif(payload ->> 'customer_note', ''),
    exists (select 1 from tmp_lines where is_demonstration)
  );

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, sku, color_name, size_label, quantity,
    unit_price_minor, line_total_minor, currency, tax_category
  )
  select order_id, product_id, variant_id, product_name, sku, color_name, size_label, quantity,
    unit_price, line_total, currency, tax_category
  from tmp_lines;

  insert into public.order_addresses (order_id, kind, full_name, line1, line2, city, region, postal_code, country_code, phone)
  values
    (order_id, 'shipping', address ->> 'full_name', address ->> 'line1', address ->> 'line2', address ->> 'city', address ->> 'region', address ->> 'postal_code', upper(address ->> 'country_code'), address ->> 'phone'),
    (order_id, 'billing', billing ->> 'full_name', billing ->> 'line1', billing ->> 'line2', billing ->> 'city', billing ->> 'region', billing ->> 'postal_code', upper(billing ->> 'country_code'), billing ->> 'phone');

  insert into public.order_status_history (order_id, to_status, note)
  values (order_id, 'pending_payment', 'Order created. Payment has not been confirmed.');

  for item in select * from tmp_lines loop
    update public.inventory
      set reserved = reserved + item.quantity
      where variant_id = item.variant_id and (on_hand - reserved) >= item.quantity;
    if not found then
      raise exception 'insufficient_stock';
    end if;
    insert into public.inventory_reservations (variant_id, order_id, quantity, expires_at)
    values (item.variant_id, order_id, item.quantity, reservation_until);
    insert into public.inventory_movements (variant_id, quantity_delta, reason, reference_type, reference_id, note)
    values (item.variant_id, 0, 'reserved', 'order', order_id, 'Reserved for checkout.');
  end loop;

  if discount.id is not null then
    update public.discounts set usage_count = usage_count + 1 where id = discount.id;
    insert into public.discount_redemptions (discount_id, order_id, user_id, email, amount_minor)
    values (discount.id, order_id, customer_user, payload ->> 'email', discount_minor);
  end if;

  delete from public.cart_items where cart_id = cart_row.id;

  insert into public.payments (order_id, provider, provider_reference, amount_minor, currency, status, environment)
  values (
    order_id,
    coalesce(nullif(payload ->> 'provider', ''), 'unassigned'),
    order_id::text,
    (subtotal - discount_minor) + shipping_minor + case when prices_include_tax then 0 else tax_minor end,
    currency_code,
    'pending',
    case when coalesce(payload ->> 'environment', 'test') = 'live' then 'live' else 'test' end
  );

  return jsonb_build_object(
    'ok', true,
    'replayed', false,
    'order_id', order_id,
    'order_number', order_no,
    'tracking_token', raw_token,
    'total_minor', (subtotal - discount_minor) + shipping_minor + case when prices_include_tax then 0 else tax_minor end,
    'currency', currency_code,
    'status', 'pending_payment'
  );
exception
  when others then
    if sqlerrm = 'insufficient_stock' then
      return jsonb_build_object('ok', false, 'error', 'insufficient_stock');
    end if;
    raise;
end;
$$;

create or replace function public.apply_payment_event(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
  order_row public.orders%rowtype;
  payment_row public.payments%rowtype;
  reservation record;
  program record;
  incoming text := payload ->> 'status';
  current_status text;
  next_status text;
  accrual_amount bigint;
  qualifying integer;
begin
  insert into public.payment_events (provider, event_id, order_id, sanitized)
  values (payload ->> 'provider', payload ->> 'event_id', (payload ->> 'order_id')::uuid, coalesce(payload -> 'sanitized', '{}'::jsonb))
  on conflict (provider, event_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select * into order_row from public.orders where id = (payload ->> 'order_id')::uuid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;
  if order_row.total_minor <> (payload ->> 'amount_minor')::bigint
    or order_row.currency <> upper(payload ->> 'currency') then
    return jsonb_build_object('ok', false, 'error', 'amount_mismatch');
  end if;

  select * into payment_row from public.payments
  where order_id = order_row.id and provider = payload ->> 'provider'
  order by created_at desc
  limit 1
  for update;

  if not found then
    insert into public.payments (order_id, provider, provider_reference, amount_minor, currency, status, environment)
    values (
      order_row.id, payload ->> 'provider', payload ->> 'provider_reference',
      (payload ->> 'amount_minor')::bigint, upper(payload ->> 'currency'), 'pending',
      case when payload ->> 'environment' = 'live' then 'live' else 'test' end
    )
    returning * into payment_row;
  end if;

  current_status := payment_row.status;
  if (current_status = 'pending' and incoming in ('processing', 'authorized', 'paid', 'failed', 'cancelled'))
    or (current_status = 'processing' and incoming in ('authorized', 'paid', 'failed', 'cancelled'))
    or (current_status = 'authorized' and incoming in ('paid', 'failed', 'cancelled'))
    or (current_status = 'paid' and incoming in ('partially_refunded', 'refunded'))
    or (current_status = 'partially_refunded' and incoming in ('partially_refunded', 'refunded'))
  then
    next_status := incoming;
  elsif current_status = incoming then
    return jsonb_build_object('ok', true, 'duplicate', false, 'ignored', true, 'status', current_status);
  else
    return jsonb_build_object('ok', false, 'error', 'illegal_transition', 'from', current_status, 'to', incoming);
  end if;

  update public.payments
    set status = next_status,
        provider_reference = coalesce(payload ->> 'provider_reference', provider_reference),
        environment = case when payload ->> 'environment' = 'live' then 'live' else environment end
    where id = payment_row.id;

  if next_status = 'paid' then
    update public.orders set status = 'paid' where id = order_row.id;
    for reservation in
      select * from public.inventory_reservations
      where order_id = order_row.id and consumed_at is null and released_at is null
      for update
    loop
      update public.inventory
        set on_hand = on_hand - reservation.quantity,
            reserved = reserved - reservation.quantity
        where variant_id = reservation.variant_id and on_hand >= reservation.quantity and reserved >= reservation.quantity;
      update public.inventory_reservations set consumed_at = now() where id = reservation.id;
      insert into public.inventory_movements (variant_id, quantity_delta, reason, reference_type, reference_id)
      values (reservation.variant_id, -reservation.quantity, 'sale', 'order', order_row.id);
    end loop;

    for program in
      select * from public.conservation_programs
      where is_active
        and (starts_at is null or starts_at <= now())
        and (ends_at is null or ends_at >= now())
        and currency = order_row.currency
        and 'paid' = any (eligible_statuses)
    loop
      if program.model = 'percent_profit' then
        insert into public.conservation_accruals (program_id, order_id, amount_minor, currency, status, explanation)
        values (program.id, order_row.id, 0, program.currency, 'blocked', 'Profit is not recorded on this order, so a profit-based contribution was not estimated.')
        on conflict (program_id, order_id) do nothing;
      elsif program.model = 'manual' then
        insert into public.conservation_accruals (program_id, order_id, amount_minor, currency, status, explanation)
        values (program.id, order_row.id, 0, program.currency, 'manual', 'Awaiting an approved manual contribution.')
        on conflict (program_id, order_id) do nothing;
      elsif program.model = 'fixed_per_item' then
        select coalesce(sum(quantity), 0) into qualifying from public.order_items where order_id = order_row.id;
        accrual_amount := coalesce(program.fixed_minor, 0) * qualifying;
        insert into public.conservation_accruals (program_id, order_id, amount_minor, currency, basis_minor, status, explanation)
        values (program.id, order_row.id, accrual_amount, program.currency, qualifying, 'calculated', 'Accrued from qualifying items. This is not a payment.')
        on conflict (program_id, order_id) do nothing;
      else
        accrual_amount := public.round_half_up_div((order_row.subtotal_minor - order_row.discount_minor) * coalesce(program.rate_bps, 0), 10000);
        insert into public.conservation_accruals (program_id, order_id, amount_minor, currency, basis_minor, status, explanation)
        values (
          program.id, order_row.id, accrual_amount, program.currency,
          order_row.subtotal_minor - order_row.discount_minor, 'calculated',
          'Accrued from merchandise after discounts, excluding shipping and tax. This is not a payment.'
        )
        on conflict (program_id, order_id) do nothing;
      end if;
    end loop;
  elsif next_status in ('failed', 'cancelled') then
    update public.orders set status = case when next_status = 'failed' then 'payment_failed' else 'cancelled' end where id = order_row.id;
    for reservation in
      select * from public.inventory_reservations
      where order_id = order_row.id and consumed_at is null and released_at is null
      for update
    loop
      update public.inventory set reserved = greatest(reserved - reservation.quantity, 0) where variant_id = reservation.variant_id;
      update public.inventory_reservations set released_at = now() where id = reservation.id;
    end loop;
    update public.discounts d
      set usage_count = greatest(usage_count - 1, 0)
      where d.id in (select discount_id from public.discount_redemptions where order_id = order_row.id);
  elsif next_status = 'refunded' then
    update public.orders set status = 'refunded' where id = order_row.id;
  elsif next_status = 'partially_refunded' then
    update public.orders set status = 'partially_refunded' where id = order_row.id;
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (order_row.id, order_row.status, (select status from public.orders where id = order_row.id), 'Payment event ' || (payload ->> 'event_id'));

  insert into public.audit_logs (action, entity_type, entity_id, metadata)
  values ('payment_event', 'order', order_row.id, jsonb_build_object('provider', payload ->> 'provider', 'status', next_status, 'environment', payload ->> 'environment'));

  return jsonb_build_object('ok', true, 'duplicate', false, 'status', next_status, 'order_id', order_row.id);
end;
$$;

revoke all on function public.checkout_create_order(jsonb) from public, anon, authenticated;
revoke all on function public.apply_payment_event(jsonb) from public, anon, authenticated;
revoke all on function public.release_expired_reservations() from public, anon, authenticated;
grant execute on function public.checkout_create_order(jsonb) to service_role;
grant execute on function public.apply_payment_event(jsonb) to service_role;
grant execute on function public.release_expired_reservations() to service_role;

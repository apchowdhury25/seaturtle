-- Row Level Security. Service role bypasses these policies and is used only on the server
-- for guest checkout, webhooks, and the owner bootstrap script.

create or replace function public.app_has_permission(requested text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = auth.uid() and rp.permission = requested
  );
$$;

revoke all on function public.app_has_permission(text) from public;
grant execute on function public.app_has_permission(text) to anon, authenticated, service_role;

do $$
declare
  table_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.app_has_permission('customers.read'));
create policy profiles_update on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.app_has_permission('staff.manage'));
create policy roles_write on public.user_roles
  for insert with check (public.app_has_permission('staff.manage'));
create policy roles_update on public.user_roles
  for update using (public.app_has_permission('staff.manage'))
  with check (public.app_has_permission('staff.manage'));
create policy roles_delete on public.user_roles
  for delete using (public.app_has_permission('staff.manage'));

create policy permissions_read on public.role_permissions
  for select using (auth.role() = 'authenticated');

create policy addresses_select on public.customer_addresses
  for select using (user_id = auth.uid() or public.app_has_permission('customers.read'));
create policy addresses_insert on public.customer_addresses
  for insert with check (user_id = auth.uid() or public.app_has_permission('customers.write'));
create policy addresses_update on public.customer_addresses
  for update using (user_id = auth.uid() or public.app_has_permission('customers.write'))
  with check (user_id = auth.uid() or public.app_has_permission('customers.write'));
create policy addresses_delete on public.customer_addresses
  for delete using (user_id = auth.uid() or public.app_has_permission('customers.write'));

create policy categories_read on public.categories
  for select using (is_active or public.app_has_permission('catalog.read'));
create policy categories_write on public.categories
  for insert with check (public.app_has_permission('catalog.write'));
create policy categories_update on public.categories
  for update using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));
create policy categories_delete on public.categories
  for delete using (public.app_has_permission('catalog.write'));

create policy collections_read on public.collections
  for select using ((is_public and is_demonstration = false) or public.app_has_permission('catalog.read'));
create policy collections_write on public.collections
  for insert with check (public.app_has_permission('catalog.write'));
create policy collections_update on public.collections
  for update using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));
create policy collections_delete on public.collections
  for delete using (public.app_has_permission('catalog.write'));

create policy collection_products_read on public.collection_products
  for select using (
    public.app_has_permission('catalog.read')
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.is_demonstration = false
    )
  );
create policy collection_products_write on public.collection_products
  for insert with check (public.app_has_permission('catalog.write'));
create policy collection_products_delete on public.collection_products
  for delete using (public.app_has_permission('catalog.write'));

create policy products_read on public.products
  for select using ((status = 'active' and is_demonstration = false) or public.app_has_permission('catalog.read'));
create policy products_insert on public.products
  for insert with check (public.app_has_permission('catalog.write'));
create policy products_update on public.products
  for update using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));
create policy products_delete on public.products
  for delete using (public.app_has_permission('catalog.write'));

create policy images_read on public.product_images
  for select using (
    public.app_has_permission('catalog.read')
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.is_demonstration = false
    )
  );
create policy images_write on public.product_images
  for insert with check (public.app_has_permission('catalog.write'));
create policy images_update on public.product_images
  for update using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));
create policy images_delete on public.product_images
  for delete using (public.app_has_permission('catalog.write'));

create policy variants_read on public.product_variants
  for select using (
    public.app_has_permission('catalog.read')
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.is_demonstration = false
    )
  );
create policy variants_insert on public.product_variants
  for insert with check (public.app_has_permission('catalog.write'));
create policy variants_update on public.product_variants
  for update using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));
create policy variants_delete on public.product_variants
  for delete using (public.app_has_permission('catalog.write'));

create policy inventory_read on public.inventory
  for select using (
    public.app_has_permission('catalog.read')
    or exists (
      select 1 from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = variant_id and p.status = 'active' and p.is_demonstration = false
    )
  );
create policy inventory_write on public.inventory
  for all using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));

create policy movements_staff on public.inventory_movements
  for select using (public.app_has_permission('catalog.read'));
create policy reservations_staff on public.inventory_reservations
  for select using (public.app_has_permission('orders.read'));

create policy carts_own on public.carts
  for select using (user_id = auth.uid());
create policy cart_items_own on public.cart_items
  for select using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

create policy wishlists_own on public.wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_items_own on public.wishlist_items
  for all using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  );

create policy discounts_read on public.discounts
  for select using (public.app_has_permission('discounts.write') or public.app_has_permission('orders.read'));
create policy discounts_write on public.discounts
  for all using (public.app_has_permission('discounts.write'))
  with check (public.app_has_permission('discounts.write'));
create policy redemptions_staff on public.discount_redemptions
  for select using (public.app_has_permission('orders.read') or user_id = auth.uid());

create policy zones_read on public.shipping_zones
  for select using (is_active or public.app_has_permission('shipping.write'));
create policy zones_write on public.shipping_zones
  for all using (public.app_has_permission('shipping.write'))
  with check (public.app_has_permission('shipping.write'));
create policy methods_read on public.shipping_methods
  for select using ((is_active and is_demonstration = false) or public.app_has_permission('shipping.write'));
create policy methods_write on public.shipping_methods
  for all using (public.app_has_permission('shipping.write'))
  with check (public.app_has_permission('shipping.write'));
create policy taxes_read on public.tax_rules
  for select using (is_active or public.app_has_permission('shipping.write') or public.app_has_permission('settings.write'));
create policy taxes_write on public.tax_rules
  for all using (public.app_has_permission('settings.write'))
  with check (public.app_has_permission('settings.write'));

create policy orders_read on public.orders
  for select using (user_id = auth.uid() or public.app_has_permission('orders.read'));
create policy orders_staff_update on public.orders
  for update using (public.app_has_permission('orders.write'))
  with check (public.app_has_permission('orders.write'));

create policy order_items_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.app_has_permission('orders.read'))
    )
  );
create policy order_addresses_read on public.order_addresses
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.app_has_permission('orders.read'))
    )
  );
create policy order_history_read on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.app_has_permission('orders.read'))
    )
  );
create policy payments_read on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.app_has_permission('orders.read'))
    )
  );
create policy payment_events_staff on public.payment_events
  for select using (public.app_has_permission('orders.read'));
create policy refunds_staff on public.refunds
  for select using (public.app_has_permission('orders.read'));
create policy refunds_insert on public.refunds
  for insert with check (public.app_has_permission('orders.refund'));
create policy shipments_read on public.shipments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.app_has_permission('orders.read'))
    )
  );
create policy shipments_write on public.shipments
  for insert with check (public.app_has_permission('orders.write'));
create policy shipments_update on public.shipments
  for update using (public.app_has_permission('orders.write'))
  with check (public.app_has_permission('orders.write'));
create policy shipment_items_read on public.shipment_items
  for select using (
    exists (
      select 1 from public.shipments s
      join public.orders o on o.id = s.order_id
      where s.id = shipment_id and (o.user_id = auth.uid() or public.app_has_permission('orders.read'))
    )
  );

create policy reviews_read on public.product_reviews
  for select using (status = 'approved' or user_id = auth.uid() or public.app_has_permission('catalog.read'));
create policy reviews_insert on public.product_reviews
  for insert with check (user_id = auth.uid() and status = 'pending');
create policy reviews_moderate on public.product_reviews
  for update using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));

create policy newsletter_staff on public.newsletter_subscriptions
  for select using (public.app_has_permission('content.write'));
create policy contact_staff on public.contact_requests
  for select using (public.app_has_permission('support.read'));
create policy tickets_staff on public.support_tickets
  for select using (public.app_has_permission('support.read'));
create policy tickets_update on public.support_tickets
  for update using (public.app_has_permission('support.write'))
  with check (public.app_has_permission('support.write'));
create policy ticket_messages_staff on public.support_ticket_messages
  for select using (public.app_has_permission('support.read'));
create policy ticket_messages_insert on public.support_ticket_messages
  for insert with check (public.app_has_permission('support.write'));

create policy suppliers_read on public.suppliers
  for select using (
    (is_public and disclosure_authorized and status = 'approved' and is_demonstration = false)
    or public.app_has_permission('sustainability.read')
  );
create policy suppliers_write on public.suppliers
  for all using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy supplier_contacts_read on public.supplier_contacts
  for select using (public.app_has_permission('sustainability.read'));
create policy supplier_contacts_write on public.supplier_contacts
  for insert with check (public.app_has_permission('sustainability.write'));
create policy supplier_contacts_update on public.supplier_contacts
  for update using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy supplier_contacts_delete on public.supplier_contacts
  for delete using (public.app_has_permission('sustainability.write'));
create policy supplier_docs_read on public.supplier_documents
  for select using (public.app_has_permission('sustainability.read'));
create policy supplier_docs_write on public.supplier_documents
  for insert with check (public.app_has_permission('sustainability.write'));
create policy supplier_docs_delete on public.supplier_documents
  for delete using (public.app_has_permission('sustainability.write'));
create policy facilities_read on public.manufacturing_facilities
  for select using ((is_public and is_demonstration = false) or public.app_has_permission('sustainability.read'));
create policy facilities_write on public.manufacturing_facilities
  for all using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy certifications_read on public.certifications
  for select using (
    (is_public and status = 'verified' and is_demonstration = false)
    or public.app_has_permission('sustainability.read')
  );
create policy certifications_write on public.certifications
  for all using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy audits_read on public.supplier_audits
  for select using (public.app_has_permission('sustainability.read'));
create policy audits_write on public.supplier_audits
  for insert with check (public.app_has_permission('sustainability.write'));
create policy audits_update on public.supplier_audits
  for update using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy materials_read on public.raw_materials
  for select using (public.app_has_permission('sustainability.read'));
create policy materials_write on public.raw_materials
  for insert with check (public.app_has_permission('sustainability.write'));
create policy materials_update on public.raw_materials
  for update using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy material_batches_read on public.material_batches
  for select using (public.app_has_permission('sustainability.read'));
create policy material_batches_write on public.material_batches
  for insert with check (public.app_has_permission('sustainability.write'));
create policy production_batches_read on public.production_batches
  for select using (public.app_has_permission('sustainability.read'));
create policy production_batches_write on public.production_batches
  for insert with check (public.app_has_permission('sustainability.write'));
create policy batch_links_read on public.product_batch_links
  for select using (public.app_has_permission('sustainability.read'));
create policy batch_links_write on public.product_batch_links
  for insert with check (public.app_has_permission('sustainability.write'));
create policy trace_read on public.product_traceability_records
  for select using (
    (is_published and is_demonstration = false)
    or public.app_has_permission('sustainability.read')
  );
create policy trace_write on public.product_traceability_records
  for all using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy measurements_read on public.environmental_measurements
  for select using ((is_public) or public.app_has_permission('sustainability.read'));
create policy measurements_write on public.environmental_measurements
  for all using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));
create policy actions_read on public.corrective_actions
  for select using (is_public or public.app_has_permission('sustainability.read'));
create policy actions_write on public.corrective_actions
  for all using (public.app_has_permission('sustainability.write'))
  with check (public.app_has_permission('sustainability.write'));

create policy orgs_read on public.conservation_organizations
  for select using ((is_public and is_demonstration = false) or public.app_has_permission('conservation.read'));
create policy orgs_write on public.conservation_organizations
  for all using (public.app_has_permission('conservation.write'))
  with check (public.app_has_permission('conservation.write'));
create policy programs_read on public.conservation_programs
  for select using ((is_public and is_demonstration = false) or public.app_has_permission('conservation.read'));
create policy programs_write on public.conservation_programs
  for all using (public.app_has_permission('conservation.write'))
  with check (public.app_has_permission('conservation.write'));
create policy accruals_staff on public.conservation_accruals
  for select using (public.app_has_permission('conservation.read'));
create policy payments_conservation_read on public.conservation_payments
  for select using (
    (is_public and approval_status = 'approved')
    or public.app_has_permission('conservation.read')
  );
create policy payments_conservation_write on public.conservation_payments
  for insert with check (public.app_has_permission('conservation.write'));

create policy pages_read on public.content_pages
  for select using (status = 'published' or public.app_has_permission('content.write'));
create policy pages_write on public.content_pages
  for all using (public.app_has_permission('content.write'))
  with check (public.app_has_permission('content.write'));
create policy announcements_read on public.announcements
  for select using (is_active or public.app_has_permission('content.write'));
create policy announcements_write on public.announcements
  for all using (public.app_has_permission('content.write'))
  with check (public.app_has_permission('content.write'));
create policy banners_read on public.banners
  for select using (is_active or public.app_has_permission('content.write'));
create policy banners_write on public.banners
  for all using (public.app_has_permission('content.write'))
  with check (public.app_has_permission('content.write'));
create policy settings_read on public.site_settings
  for select using (true);
create policy settings_write on public.site_settings
  for all using (public.app_has_permission('settings.write'))
  with check (public.app_has_permission('settings.write'));
create policy articles_read on public.editorial_articles
  for select using (status = 'published' or public.app_has_permission('content.write'));
create policy articles_write on public.editorial_articles
  for all using (public.app_has_permission('content.write'))
  with check (public.app_has_permission('content.write'));
create policy redirects_read on public.redirects
  for select using (is_active or public.app_has_permission('content.write'));
create policy redirects_write on public.redirects
  for all using (public.app_has_permission('content.write'))
  with check (public.app_has_permission('content.write'));
create policy notifications_staff on public.notification_logs
  for select using (public.app_has_permission('audit.read') or public.app_has_permission('orders.read'));
create policy audit_read on public.audit_logs
  for select using (public.app_has_permission('audit.read'));
create policy analytics_read on public.analytics_events
  for select using (public.app_has_permission('analytics.read'));
create policy privacy_own on public.privacy_requests
  for select using (user_id = auth.uid() or public.app_has_permission('customers.read'));
create policy privacy_insert on public.privacy_requests
  for insert with check (user_id is null or user_id = auth.uid());
create policy privacy_update on public.privacy_requests
  for update using (public.app_has_permission('customers.write'))
  with check (public.app_has_permission('customers.write'));
create policy size_charts_read on public.size_charts
  for select using (is_active or public.app_has_permission('catalog.read'));
create policy size_charts_write on public.size_charts
  for all using (public.app_has_permission('catalog.write'))
  with check (public.app_has_permission('catalog.write'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('collection-images', 'collection-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('brand-assets', 'brand-assets', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('supplier-documents', 'supplier-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png']),
  ('certifications', 'certifications', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png']),
  ('support-attachments', 'support-attachments', false, 8388608, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_public_read on storage.objects
  for select using (bucket_id in ('product-images', 'collection-images', 'brand-assets'));
create policy storage_private_staff on storage.objects
  for select using (
    bucket_id in ('supplier-documents', 'certifications') and public.app_has_permission('sustainability.read')
  );
create policy storage_support_staff on storage.objects
  for select using (bucket_id = 'support-attachments' and public.app_has_permission('support.read'));

grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant select on tables to anon, authenticated, service_role;
alter default privileges in schema public grant insert, update, delete on tables to authenticated, service_role;
